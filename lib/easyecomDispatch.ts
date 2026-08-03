import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import { MODELS } from "./panelModels";
import { rowToApi } from "./panelMap";
import { ensureOrderInfra } from "./orderNumber";
import {
  pushOrderToEasyEcom,
  cancelEasyEcomOrder,
  isEasyEcomConfigured,
  type EasyEcomOrderInput,
} from "./easyecom";

/**
 * EasyEcom dispatch worker — pushes orders that are past their hold window.
 * ---------------------------------------------------------------------------
 * Runs from three places: the background interval (instrumentation.ts), the
 * cron/manual route (/api/easyecom/dispatch), and the panel "send now" button.
 * Picks up any order that is not yet synced, not cancelled, and due
 * (dispatch_at <= now). An online (prepaid) order is skipped until it's paid.
 *
 * Failures are recorded on the order (easyecom_ref = error) but leave it
 * unsynced so the next run retries it.
 */

export interface DispatchReport {
  configured: boolean;
  scanned: number;
  pushed: number;
  skipped: number; // not yet due / not paid (only counted when forced scan finds them ineligible)
  failed: number;
  results: { orderNumber: string; ok: boolean; ref?: string; error?: string }[];
}

let running = false;

/** Auto-retries per order before it needs manual attention (force ignores this). */
export const MAX_ATTEMPTS = 10;

function isOnlineUnpaid(api: Record<string, unknown>): boolean {
  const method = String(api.paymentMethod ?? "cod").toLowerCase();
  const status = String(api.status ?? "pending").toLowerCase();
  return method !== "cod" && status === "pending";
}

/**
 * Push all due orders to EasyEcom.
 * @param force ignore the hold window and push every eligible unsynced order now.
 */
export async function dispatchDueOrders(opts: { force?: boolean; limit?: number } = {}): Promise<DispatchReport> {
  const { force = false, limit = 50 } = opts;
  const report: DispatchReport = { configured: isEasyEcomConfigured(), scanned: 0, pushed: 0, skipped: 0, failed: 0, results: [] };

  if (!report.configured) return report; // nothing to do until keys are set
  if (running) return report; // avoid overlapping runs in the same process
  running = true;
  try {
    await ensureOrderInfra();
    const pool = getPanelPool();
    const now = new Date().toISOString();

    const conds = ["easyecom_synced = 0", "status <> 'cancelled'"];
    const params: unknown[] = [];
    if (!force) {
      conds.push("(dispatch_at IS NULL OR dispatch_at <= ?)");
      params.push(now);
      // Stop re-pushing an order that keeps failing for a reason a retry can't
      // fix (missing SKU, unknown pack). After MAX_ATTEMPTS it needs the owner
      // to correct the data and press "send now" (force), which ignores this.
      conds.push("(easyecom_attempts IS NULL OR easyecom_attempts < ?)");
      params.push(MAX_ATTEMPTS);
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM \`orders\` WHERE ${conds.join(" AND ")} ORDER BY created_at ASC LIMIT ${Number(limit)}`,
      params
    );

    for (const row of rows) {
      report.scanned++;
      const api = rowToApi(MODELS.orders, row);

      // Prepaid order that hasn't been paid yet — don't fulfill it.
      if (isOnlineUnpaid(api)) {
        report.skipped++;
        continue;
      }

      const orderNumber = String(api.orderNumber ?? api.id ?? "");

      // Re-read the status IMMEDIATELY before pushing. The rows were selected in
      // one go and each push takes a network round-trip, so an order cancelled
      // during that window would otherwise still be sent — and then ship.
      const [fresh] = await pool.query<RowDataPacket[]>(
        "SELECT status, easyecom_synced FROM `orders` WHERE id = ? LIMIT 1",
        [api.id]
      );
      if (
        !fresh[0] ||
        String(fresh[0].status ?? "").toLowerCase() === "cancelled" ||
        Number(fresh[0].easyecom_synced) === 1
      ) {
        report.skipped++;
        continue;
      }

      const result = await pushOrderToEasyEcom(api as unknown as EasyEcomOrderInput);

      // Full audit: attempt count + a per-attempt history (last 10 kept), so the
      // panel shows exactly what happened with each order and when.
      const stamp = new Date().toISOString();
      const prevLog = Array.isArray(api.easyecomLog) ? (api.easyecomLog as unknown[]) : [];
      const attempts = Number(api.easyecomAttempts ?? 0) + 1;

      if (result.ok) {
        report.pushed++;

        // The order can still be cancelled DURING the push (the API round-trip
        // is the last unguarded window). Two things must then happen, and the
        // old code did neither: keep the cancellation — writing the snapshot's
        // status back used to silently revert it to "processing" — and undo the
        // order inside EasyEcom, since it really was created there.
        const [after] = await pool.query<RowDataPacket[]>(
          "SELECT status FROM `orders` WHERE id = ? LIMIT 1",
          [api.id]
        );
        const cancelledMidPush =
          String(after[0]?.status ?? "").toLowerCase() === "cancelled";

        const entries: unknown[] = [{ at: stamp, ok: true, ref: result.ref ?? "ok" }];
        if (cancelledMidPush) {
          const undo = await cancelEasyEcomOrder(orderNumber);
          entries.push(
            undo.ok
              ? { at: stamp, ok: true, ref: "cancelled in EasyEcom (was cancelled mid-push)", cancel: true }
              : { at: stamp, ok: false, cancel: true, error: `Cancelled during the push, but the EasyEcom cancel failed: ${undo.error} — cancel it in EasyEcom by hand.` }
          );
          report.results.push({
            orderNumber,
            ok: undo.ok,
            error: undo.ok
              ? "pushed, then cancelled in EasyEcom (cancelled mid-push)"
              : `pushed but cancel failed: ${undo.error}`,
          });
        } else {
          report.results.push({ orderNumber, ok: true, ref: result.ref });
        }

        const log = [...prevLog, ...entries].slice(-10);
        const snapshot = String(api.status ?? "pending").toLowerCase();
        const nextStatus = cancelledMidPush
          ? "cancelled"
          : snapshot === "pending"
            ? "processing"
            : snapshot;
        await pool.query(
          "UPDATE `orders` SET easyecom_synced = 1, easyecom_ref = ?, easyecom_error = NULL, easyecom_pushed_at = ?, easyecom_attempts = ?, easyecom_log = ?, status = ?, updated_at = ? WHERE id = ?",
          [result.ref ?? "ok", stamp, attempts, JSON.stringify(log), nextStatus, stamp, api.id]
        );
      } else {
        report.failed++;
        report.results.push({ orderNumber, ok: false, error: result.error });
        const error = String(result.error ?? "push failed").slice(0, 500);
        const log = [...prevLog, { at: stamp, ok: false, error }].slice(-10);
        // A bad endpoint/token is OUR problem, not this order's: don't spend the
        // order's retry budget on it, or one misconfigured window silently caps
        // every pending order and each then needs a manual force-push.
        const nextAttempts = result.configError ? Number(api.easyecomAttempts ?? 0) : attempts;
        // Record the reason but keep it unsynced so the next run retries.
        await pool.query(
          "UPDATE `orders` SET easyecom_error = ?, easyecom_attempts = ?, easyecom_log = ?, updated_at = ? WHERE id = ?",
          [error, nextAttempts, JSON.stringify(log), stamp, api.id]
        );
      }
    }
    return report;
  } finally {
    running = false;
  }
}

export interface CancelResult {
  /** Local status was set to cancelled. */
  cancelled: boolean;
  orderNumber?: string;
  /** true when the order had already been pushed and EasyEcom was told too. */
  easyecomCancelled?: boolean;
  /** Set when the order was pushed but EasyEcom refused/failed the cancel. */
  easyecomError?: string;
  /** The order never reached EasyEcom, so there was nothing to cancel there. */
  wasNotPushed?: boolean;
}

/**
 * Cancel an order EVERYWHERE: locally, and — if it was already pushed — inside
 * EasyEcom too. Cancelling only locally leaves a live order in EasyEcom that
 * still ships, which is exactly the trap this closes.
 *
 * The local cancel is applied even when the EasyEcom call fails, so the panel
 * always reflects the owner's decision; the failure is reported (and logged on
 * the order) so it can be finished by hand.
 */
export async function cancelOrderEverywhere(orderId: string): Promise<CancelResult> {
  await ensureOrderInfra();
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM `orders` WHERE id = ? LIMIT 1",
    [orderId]
  );
  if (!rows[0]) return { cancelled: false, easyecomError: "Order not found." };

  const api = rowToApi(MODELS.orders, rows[0]);
  const orderNumber = String(api.orderNumber ?? api.id ?? "");
  const stamp = new Date().toISOString();
  const wasPushed = Boolean(api.easyecomSynced);

  // Local cancel first — it also removes the order from the dispatch queue, so
  // a not-yet-pushed order can never slip out while we're talking to EasyEcom.
  await pool.query("UPDATE `orders` SET status = 'cancelled', updated_at = ? WHERE id = ?", [
    stamp,
    api.id,
  ]);

  if (!wasPushed) return { cancelled: true, orderNumber, wasNotPushed: true };

  const result = await cancelEasyEcomOrder(orderNumber);
  const prevLog = Array.isArray(api.easyecomLog) ? (api.easyecomLog as unknown[]) : [];
  const log = [
    ...prevLog,
    result.ok
      ? { at: stamp, ok: true, ref: "cancelled in EasyEcom", cancel: true }
      : { at: stamp, ok: false, error: `Cancel failed: ${result.error}`, cancel: true },
  ].slice(-10);
  await pool.query("UPDATE `orders` SET easyecom_log = ?, updated_at = ? WHERE id = ?", [
    JSON.stringify(log),
    stamp,
    api.id,
  ]);

  return result.ok
    ? { cancelled: true, orderNumber, easyecomCancelled: true }
    : { cancelled: true, orderNumber, easyecomError: result.error };
}

export interface SingleDispatchResult {
  configured: boolean;
  ok: boolean;
  orderNumber?: string;
  ref?: string;
  error?: string;
}

/**
 * Force-push ONE order right now (panel "Push to EasyEcom now" button).
 * Ignores the hold window and the attempt cap, but still refuses orders that
 * are cancelled, already pushed, or online-but-unpaid.
 */
export async function dispatchSingleOrder(orderId: string): Promise<SingleDispatchResult> {
  if (!isEasyEcomConfigured()) {
    return {
      configured: false,
      ok: false,
      error: "EasyEcom is not configured — set EASYECOM_API_URL and EASYECOM_API_TOKEN, then restart.",
    };
  }
  await ensureOrderInfra();
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM `orders` WHERE id = ? LIMIT 1",
    [orderId]
  );
  if (!rows[0]) return { configured: true, ok: false, error: "Order not found." };

  const api = rowToApi(MODELS.orders, rows[0]);
  const orderNumber = String(api.orderNumber ?? api.id ?? "");
  if (String(api.status ?? "").toLowerCase() === "cancelled") {
    return { configured: true, ok: false, orderNumber, error: "Order is cancelled — cancelled orders are never pushed." };
  }
  if (api.easyecomSynced) {
    return { configured: true, ok: false, orderNumber, error: "Already pushed to EasyEcom." };
  }
  if (isOnlineUnpaid(api)) {
    return { configured: true, ok: false, orderNumber, error: "Online order is not paid yet — an unpaid order is never fulfilled." };
  }

  const result = await pushOrderToEasyEcom(api as unknown as EasyEcomOrderInput);
  const stamp = new Date().toISOString();
  const prevLog = Array.isArray(api.easyecomLog) ? (api.easyecomLog as unknown[]) : [];
  const attempts = Number(api.easyecomAttempts ?? 0) + 1;

  if (result.ok) {
    // Same mid-push cancellation guard as the worker: never write the stale
    // snapshot status back over a cancel, and undo the order in EasyEcom.
    const [after] = await pool.query<RowDataPacket[]>(
      "SELECT status FROM `orders` WHERE id = ? LIMIT 1",
      [api.id]
    );
    const cancelledMidPush = String(after[0]?.status ?? "").toLowerCase() === "cancelled";

    const entries: unknown[] = [{ at: stamp, ok: true, ref: result.ref ?? "ok", manual: true }];
    let undoError: string | undefined;
    if (cancelledMidPush) {
      const undo = await cancelEasyEcomOrder(orderNumber);
      undoError = undo.ok ? undefined : undo.error;
      entries.push(
        undo.ok
          ? { at: stamp, ok: true, ref: "cancelled in EasyEcom (was cancelled mid-push)", cancel: true }
          : { at: stamp, ok: false, cancel: true, error: `Cancelled during the push, but the EasyEcom cancel failed: ${undo.error} — cancel it in EasyEcom by hand.` }
      );
    }

    const log = [...prevLog, ...entries].slice(-10);
    const snapshot = String(api.status ?? "pending").toLowerCase();
    const nextStatus = cancelledMidPush
      ? "cancelled"
      : snapshot === "pending"
        ? "processing"
        : snapshot;
    await pool.query(
      "UPDATE `orders` SET easyecom_synced = 1, easyecom_ref = ?, easyecom_error = NULL, easyecom_pushed_at = ?, easyecom_attempts = ?, easyecom_log = ?, status = ?, updated_at = ? WHERE id = ?",
      [result.ref ?? "ok", stamp, attempts, JSON.stringify(log), nextStatus, stamp, api.id]
    );
    if (cancelledMidPush) {
      return {
        configured: true,
        ok: !undoError,
        orderNumber,
        error: undoError
          ? `Pushed, but the order was cancelled meanwhile and EasyEcom refused the cancel: ${undoError}`
          : undefined,
        ref: result.ref,
      };
    }
    return { configured: true, ok: true, orderNumber, ref: result.ref };
  }

  const error = String(result.error ?? "push failed").slice(0, 500);
  const log = [...prevLog, { at: stamp, ok: false, error, manual: true }].slice(-10);
  // Config-level failures don't count against the retry budget (see the worker).
  const nextAttempts = result.configError ? Number(api.easyecomAttempts ?? 0) : attempts;
  await pool.query(
    "UPDATE `orders` SET easyecom_error = ?, easyecom_attempts = ?, easyecom_log = ?, updated_at = ? WHERE id = ?",
    [error, nextAttempts, JSON.stringify(log), stamp, api.id]
  );
  return { configured: true, ok: false, orderNumber, error };
}
