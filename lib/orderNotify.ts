import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPanelPool } from "./panelDb";
import { ensureOrderInfra } from "./orderNumber";
import { isAisensyConfigured, sendAisensyTemplate, templateParam } from "./smsProvider";
import { paymentTypeOf, balanceDue } from "./paymentType";

/**
 * WhatsApp order confirmation (AiSensy campaign "meenazo_order_confirm").
 * ---------------------------------------------------------------------------
 * Template body:
 *   Hi {{1}} 👋  ·  Order ID {{2}}  ·  Product {{3}}  ·  Amount ₹{{4}}  ·  Payment {{5}}
 *
 * Sent EXACTLY ONCE per order. The order row carries the send stamp
 * (`whatsapp_sent_at`) and the claim is an atomic conditional UPDATE, so the
 * three paths that can confirm the same order — the COD route, the browser's
 * /razorpay/verify call and Razorpay's server-to-server webhook — can all race
 * and still only one message goes out. A failed send releases the claim so the
 * next attempt (or the panel's Resend button) can retry.
 *
 * Env: AISENSY_API_KEY (shared with OTP) + AISENSY_ORDER_CAMPAIGN.
 */

export interface NotifyResult {
  sent: boolean;
  /** Why nothing was sent: already-sent | not-configured | no-order | no-number */
  skipped?: string;
  error?: string;
  destination?: string;
}

interface OrderItemLike {
  name?: unknown;
  quantity?: unknown;
  variant?: unknown;
}

export function orderCampaign(): string {
  return (process.env.AISENSY_ORDER_CAMPAIGN ?? "meenazo_order_confirm").trim();
}

/** The confirmation can only go out when AiSensy itself is configured. */
export function isOrderWhatsappConfigured(): boolean {
  return isAisensyConfigured() && orderCampaign().length > 0;
}

function parseItems(raw: unknown): OrderItemLike[] {
  if (Array.isArray(raw)) return raw as OrderItemLike[];
  try {
    const parsed = raw ? JSON.parse(String(raw)) : null;
    return Array.isArray(parsed) ? (parsed as OrderItemLike[]) : [];
  } catch {
    return [];
  }
}

/** "Herbal Diasuddhi Capsule (Pack of 2) x 1 + 1 more" — one clean line. */
export function itemsSummary(raw: unknown): string {
  const items = parseItems(raw);
  if (!items.length) return "Your Meenazo order";
  const first = items[0];
  const name = String(first.name ?? "Product").trim();
  const variant = String(first.variant ?? "").trim();
  const qty = Math.max(1, Number(first.quantity ?? 1) || 1);
  const head = `${name}${variant ? ` (${variant})` : ""} x ${qty}`;
  return items.length > 1 ? `${head} + ${items.length - 1} more item${items.length > 2 ? "s" : ""}` : head;
}

/** Indian grouping without the symbol — the template already prints ₹. */
function money(n: unknown): string {
  const value = Math.max(0, Math.round(Number(n ?? 0) || 0));
  return value.toLocaleString("en-IN");
}

/** First word of the customer's name (falls back to a friendly generic). */
function firstName(full: unknown): string {
  const name = String(full ?? "").trim().split(/\s+/)[0] ?? "";
  return name || "there";
}

/** What the customer should read under "Payment": paid, partly paid, or COD. */
export function paymentLabel(row: {
  amountPaid?: unknown;
  total?: unknown;
  paymentMethod?: unknown;
  status?: unknown;
}): string {
  const type = paymentTypeOf(row);
  if (type === "prepaid") return "Paid online (Prepaid)";
  if (type === "partial") return `Part paid - Rs ${money(balanceDue(row))} due on delivery`;
  return `Cash on Delivery - Rs ${money(row.total)} to pay`;
}

/* ----------------------------- send bookkeeping ---------------------------- */

interface LogEntry {
  at: string;
  ok: boolean;
  to?: string;
  campaign?: string;
  error?: string;
}

function parseLog(raw: unknown): LogEntry[] {
  if (Array.isArray(raw)) return raw as LogEntry[];
  try {
    const parsed = raw ? JSON.parse(String(raw)) : null;
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
}

async function appendLog(orderId: string, entry: LogEntry, keepClaim: boolean): Promise<void> {
  const pool = getPanelPool();
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT whatsapp_log FROM `orders` WHERE id = ? LIMIT 1",
      [orderId]
    );
    const log = [...parseLog(rows[0]?.whatsapp_log), entry].slice(-10);
    await pool.query(
      keepClaim
        ? "UPDATE `orders` SET whatsapp_log = ? WHERE id = ?"
        : "UPDATE `orders` SET whatsapp_log = ?, whatsapp_sent_at = NULL WHERE id = ?",
      [JSON.stringify(log), orderId]
    );
  } catch (err) {
    console.error("[notify] could not write whatsapp log:", (err as Error)?.message);
  }
}

/**
 * Send the order-confirmation WhatsApp for `orderId`.
 *
 * `force` (the panel's Resend button) ignores the once-only guard; every other
 * caller should leave it off and may call this as often as it likes.
 */
export async function notifyOrderConfirmed(
  orderId: string,
  opts: { force?: boolean } = {}
): Promise<NotifyResult> {
  if (!orderId) return { sent: false, skipped: "no-order" };
  if (!isOrderWhatsappConfigured()) return { sent: false, skipped: "not-configured" };

  try {
    await ensureOrderInfra();
    const pool = getPanelPool();
    const stamp = new Date().toISOString();

    // Claim the send FIRST: whoever flips the stamp owns the message. A replayed
    // verify, a webhook arriving at the same moment, or a double-clicked button
    // all lose the race here instead of sending a duplicate.
    if (!opts.force) {
      const [claim] = await pool.query<ResultSetHeader>(
        "UPDATE `orders` SET whatsapp_sent_at = ? WHERE id = ? AND (whatsapp_sent_at IS NULL OR whatsapp_sent_at = '')",
        [stamp, orderId]
      );
      if ((claim.affectedRows ?? 0) !== 1) {
        // Either already sent, or the order id doesn't exist.
        const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM `orders` WHERE id = ? LIMIT 1", [orderId]);
        return { sent: false, skipped: exists.length ? "already-sent" : "no-order" };
      }
    }

    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM `orders` WHERE id = ? LIMIT 1", [orderId]);
    const row = rows[0];
    if (!row) return { sent: false, skipped: "no-order" };

    // WhatsApp goes to the ACCOUNT number (the OTP-verified one that actually
    // has WhatsApp); the shipping contact is only a courier fallback.
    const destination = String(row.customer_mobile ?? "").trim() || String(row.shipping_phone ?? "").trim();
    if (!destination) {
      await appendLog(orderId, { at: stamp, ok: false, error: "order has no mobile number" }, false);
      return { sent: false, skipped: "no-number" };
    }

    const params = [
      templateParam(firstName(row.customer_name), "there"), // {{1}} name
      templateParam(row.order_number, String(orderId)), // {{2}} order id
      templateParam(itemsSummary(row.items), "Your Meenazo order"), // {{3}} product
      templateParam(money(row.total), "0"), // {{4}} amount
      templateParam(
        paymentLabel({
          amountPaid: row.amount_paid,
          total: row.total,
          paymentMethod: row.payment_method,
          status: row.status,
        }),
        "Cash on Delivery"
      ), // {{5}} payment
    ];

    const res = await sendAisensyTemplate({
      campaignName: orderCampaign(),
      destination,
      templateParams: params,
      source: "meenazo order confirmation",
    });

    // On failure release the claim so a retry (webhook, or the panel button) can
    // still get the message out — a silent "sent" would strand the customer.
    await appendLog(
      orderId,
      { at: stamp, ok: res.ok, to: destination, campaign: orderCampaign(), error: res.error },
      res.ok
    );
    if (res.ok && opts.force) {
      await pool.query("UPDATE `orders` SET whatsapp_sent_at = ? WHERE id = ?", [stamp, orderId]);
    }

    if (!res.ok) console.error(`[notify] WhatsApp confirmation failed for ${orderId}:`, res.error);
    return { sent: res.ok, error: res.error, destination };
  } catch (err) {
    console.error("[notify] order confirmation failed:", err);
    return { sent: false, error: String((err as Error)?.message ?? err) };
  }
}

/**
 * Fire-and-report wrapper for request handlers: never throws, never blocks the
 * customer's response on a messaging provider being slow or down.
 */
export async function notifyOrderConfirmedSafe(orderId: string): Promise<NotifyResult> {
  try {
    return await notifyOrderConfirmed(orderId);
  } catch (err) {
    console.error("[notify] unexpected:", err);
    return { sent: false, error: String((err as Error)?.message ?? err) };
  }
}
