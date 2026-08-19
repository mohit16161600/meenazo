import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import { MODELS } from "./panelModels";
import { ddlForModel } from "./panelMap";

/**
 * Abandoned carts & checkouts — the recovery list.
 * ---------------------------------------------------------------------------
 * Two things get lost on this site and neither was written down anywhere:
 *
 *   cart     — items saved to `carts`, then nothing. That table is keyed by
 *              phone and overwritten on every save, so the moment the customer
 *              changes their cart the old abandonment is gone forever.
 *   payment  — an online order WAS started (a real MPL number exists, the
 *              gateway was opened) and the money never arrived. The order row
 *              survives, but it is buried among live orders.
 *
 * `sweepAbandonedCarts` turns both into permanent rows in `abandoned_carts` —
 * one per event, never overwritten — carrying who, when, what, how much and
 * where from. `markAbandonedRecovered` closes them off when that number
 * finally orders, which is what makes the panel's recovery rate real rather
 * than a guess.
 *
 * The sweep runs on the same background tick as the EasyEcom dispatch, so no
 * new cron is needed.
 */

export type AbandonedStage = "cart" | "payment";

/** How long something sits untouched before it counts as abandoned. */
function graceMinutes(): number {
  const raw = Number(process.env.ABANDONED_AFTER_MINUTES ?? 60);
  return Math.max(5, Number.isFinite(raw) && raw > 0 ? raw : 60);
}

let tableReady: Promise<void> | null = null;

/**
 * Create the table if it isn't there yet. Self-migrating on purpose: a live
 * install should start collecting abandonments on the next deploy without the
 * owner having to re-run /panel/setup (which is also what creates it).
 */
export function ensureAbandonedTable(): Promise<void> {
  if (tableReady) return tableReady;
  tableReady = (async () => {
    await getPanelPool().query(ddlForModel(MODELS.abandonedCarts));
  })().catch((err) => {
    tableReady = null; // let the next run retry a transient failure
    throw err;
  });
  return tableReady;
}

/** Total units in a stored items array, whatever shape it came from. */
function countItems(raw: unknown): { items: unknown[]; count: number } {
  let items: unknown[] = [];
  try {
    const parsed = raw ? JSON.parse(String(raw)) : [];
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    /* unreadable JSON — treat as empty rather than losing the whole row */
  }
  const count = items.reduce(
    (n: number, i) => n + Math.max(0, Number((i as { quantity?: unknown })?.quantity ?? 1) || 0),
    0
  );
  return { items, count };
}

export interface AbandonSweepReport {
  /** Cold carts logged FOR THE FIRST TIME on this run. */
  carts: number;
  /** Started-but-unpaid checkouts logged for the first time on this run. */
  payments: number;
}

/**
 * True when the insert created a row rather than refreshing one that was
 * already there. MySQL reports 1 for an insert and 2 for an ON DUPLICATE KEY
 * update (0 when that update changed nothing), so counting blindly would
 * report the same abandonment as "new" on every single sweep.
 */
function wasInserted(result: unknown): boolean {
  return (result as ResultSetHeader)?.affectedRows === 1;
}

const INSERT_SQL =
  "INSERT INTO `abandoned_carts` " +
  "(phone, customer_name, customer_email, stage, items, item_count, subtotal, value, coupon_code, " +
  " order_id, order_number, city, state, pincode, payment_method, source, ip, " +
  " last_activity_at, abandoned_at, recovered, created_at, updated_at) " +
  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?) " +
  // Re-running the sweep must never duplicate a checkout (order_id is UNIQUE);
  // the money fields are refreshed because an unpaid order can be re-priced
  // after the fact (the pay-online discount is taken back).
  "ON DUPLICATE KEY UPDATE items = VALUES(items), item_count = VALUES(item_count), " +
  "subtotal = VALUES(subtotal), value = VALUES(value), coupon_code = VALUES(coupon_code), " +
  "payment_method = VALUES(payment_method), updated_at = VALUES(updated_at)";

/**
 * Log everything that has gone cold since the last run. Idempotent: a checkout
 * is keyed by its order id, and a cart is marked `abandoned` in `carts` as it
 * is logged, so neither is recorded twice. Both re-arm on their own — the cart
 * flips back to `active` the next time the customer saves it.
 */
export async function sweepAbandonedCarts(): Promise<AbandonSweepReport> {
  await ensureAbandonedTable();
  const pool = getPanelPool();
  const report: AbandonSweepReport = { carts: 0, payments: 0 };

  const cutoff = new Date(Date.now() - graceMinutes() * 60 * 1000).toISOString();
  const stamp = new Date().toISOString();

  /* ---- Started a payment, the money never came ---- */
  const [orders] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM `orders` WHERE payment_method <> 'cod' AND status = 'pending' " +
      "AND COALESCE(amount_paid, 0) <= 0 AND created_at <= ? ORDER BY id DESC LIMIT 200",
    [cutoff]
  );

  for (const o of orders) {
    const { items, count } = countItems(o.items);
    const phone = String(o.customer_mobile ?? "");
    if (!phone) continue;

    const [res] = await pool.query(INSERT_SQL, [
      phone,
      o.customer_name ?? null,
      o.customer_email ?? null,
      "payment",
      JSON.stringify(items),
      count,
      Number(o.subtotal ?? 0),
      Number(o.total ?? 0),
      o.coupon_code ?? null,
      String(o.id),
      o.order_number ?? null,
      o.city ?? null,
      o.state ?? null,
      o.pincode ?? null,
      o.payment_method ?? null,
      o.source ?? null,
      o.ip ?? null,
      o.created_at ?? null,
      stamp,
      stamp,
      stamp,
    ]);
    if (wasInserted(res)) report.payments++;

    // The cart behind this checkout is the SAME abandonment. Close it here so
    // the cart pass below doesn't log a second, less informative row for it.
    await pool.query(
      "UPDATE `carts` SET status = 'abandoned', updated_at = ? WHERE phone = ? AND status = 'active'",
      [stamp, phone]
    );
  }

  /* ---- Cart went cold without an order ever being started ---- */
  const [carts] = await pool.query<RowDataPacket[]>(
    "SELECT c.*, cu.name AS cust_name, cu.email AS cust_email, cu.ip AS cust_ip " +
      "FROM `carts` c LEFT JOIN `customers` cu ON cu.phone = c.phone " +
      "WHERE c.status = 'active' AND COALESCE(c.item_count, 0) > 0 " +
      "AND COALESCE(c.last_activity_at, c.updated_at) <= ? LIMIT 200",
    [cutoff]
  );

  for (const c of carts) {
    const { items, count } = countItems(c.items);
    const phone = String(c.phone ?? "");
    if (!phone || count === 0) continue;

    const [res] = await pool.query(INSERT_SQL, [
      phone,
      c.cust_name ?? null,
      c.cust_email ?? null,
      "cart",
      JSON.stringify(items),
      count,
      Number(c.subtotal ?? 0),
      Number(c.subtotal ?? 0), // no order yet, so the cart value is what's at stake
      c.coupon_code ?? null,
      null, // no order id — this one never reached checkout
      null,
      null,
      null,
      null,
      null,
      "website",
      c.cust_ip ?? null,
      c.last_activity_at ?? c.updated_at ?? null,
      stamp,
      stamp,
      stamp,
    ]);
    if (wasInserted(res)) report.carts++;

    await pool.query(
      "UPDATE `carts` SET status = 'abandoned', updated_at = ? WHERE phone = ? AND status = 'active'",
      [stamp, phone]
    );
  }

  return report;
}

/**
 * Close off a number's open abandonments — they came back and ordered.
 *
 * Called from markCartConverted, so every order path (COD, Razorpay verify,
 * the webhook, the panel's manual payment check) reports a recovery without
 * having to remember to.
 */
export async function markAbandonedRecovered(phone: string): Promise<void> {
  const key = String(phone ?? "").trim();
  if (!key) return;
  await ensureAbandonedTable();
  const pool = getPanelPool();

  const [open] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM `abandoned_carts` WHERE phone = ? AND recovered = 0",
    [key]
  );
  if (Number(open[0]?.n ?? 0) === 0) return; // nothing open — skip the lookup

  // An ORDER is what makes it recovered. Without one there is nothing to
  // record and nothing to close: marking it anyway would both overstate the
  // recovery rate and burn the row, so the real order arriving later would
  // find it already closed and never get its number written down.
  const [latest] = await pool.query<RowDataPacket[]>(
    "SELECT order_number FROM `orders` WHERE customer_mobile = ? AND status <> 'cancelled' ORDER BY id DESC LIMIT 1",
    [key]
  );
  if (!latest.length) return;

  const stamp = new Date().toISOString();
  await pool.query(
    "UPDATE `abandoned_carts` SET recovered = 1, recovered_at = ?, recovered_order_number = ?, updated_at = ? " +
      "WHERE phone = ? AND recovered = 0",
    [stamp, latest[0].order_number ?? null, stamp, key]
  );
}
