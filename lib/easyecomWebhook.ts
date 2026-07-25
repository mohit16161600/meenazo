import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import { MODELS } from "./panelModels";
import { rowToApi } from "./panelMap";
import { ensureOrderInfra } from "./orderNumber";
import { mapEasyEcomStatus } from "./easyecomStatus";

/**
 * Apply one EasyEcom status-webhook payload to the matching order.
 * ---------------------------------------------------------------------------
 * EasyEcom status/field names vary by courier + account, so we read each value
 * from several possible keys. The order is matched by the reference we sent as
 * `orderNumber` (mpl####). Everything is stored: the raw courier status text,
 * tracking/courier/NDR details, a status timeline, and the raw payload — so the
 * customer and admin both see the full, current picture.
 */

export interface ApplyResult {
  matched: boolean;
  orderId?: string;
  orderNumber?: string;
  status?: string;
}

type Payload = Record<string, unknown>;

function pick(obj: Payload, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

/** Reference (our order number) the webhook is about. */
function extractReference(p: Payload): string {
  return pick(p, [
    "reference_code",
    "referenceCode",
    "orderNumber",
    "order_number",
    "reference",
    "client_order_id",
    "clientOrderId",
  ]);
}

export async function applyEasyEcomStatus(payload: Payload): Promise<ApplyResult> {
  await ensureOrderInfra();
  const pool = getPanelPool();

  const reference = extractReference(payload);
  const easyecomOrderId = pick(payload, ["order_id", "orderId", "easyecom_order_id", "invoice_id"]);

  // Match by our order number first, then by EasyEcom's own order id.
  let row: RowDataPacket | undefined;
  if (reference) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM `orders` WHERE order_number = ? LIMIT 1",
      [reference]
    );
    row = rows[0];
  }
  if (!row && easyecomOrderId) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM `orders` WHERE easyecom_order_id = ? LIMIT 1",
      [easyecomOrderId]
    );
    row = rows[0];
  }
  if (!row) return { matched: false };

  const api = rowToApi(MODELS.orders, row);

  const rawStatus = pick(payload, [
    "order_status",
    "orderStatus",
    "status",
    "shipping_status",
    "current_shipment_status",
    "courier_status",
    "shipment_status",
  ]);
  const tracking = pick(payload, ["awb_number", "awb", "tracking_number", "trackingNumber", "waybill", "waybill_number"]);
  const courier = pick(payload, ["courier", "carrier", "courier_name", "courierName", "courier_aggregator_name"]);
  const trackingUrl = pick(payload, ["tracking_url", "trackingUrl", "track_url", "trackingLink"]);
  const ndrReason = pick(payload, ["ndr_reason", "ndrReason", "reason", "ndr_remark", "remark", "remarks"]);

  const mapped = mapEasyEcomStatus(rawStatus);
  const stamp = new Date().toISOString();

  // Append to the human status timeline (keep the last 30 entries).
  const prevHistory = Array.isArray(api.statusHistory) ? (api.statusHistory as unknown[]) : [];
  const history = [
    ...prevHistory,
    { at: stamp, status: mapped ?? rawStatus ?? "update", note: rawStatus || undefined },
  ].slice(-30);

  // Build the update — only overwrite fields the payload actually carried.
  const sets: string[] = [
    "fulfillment_status = ?",
    "shipment_status_at = ?",
    "status_history = ?",
    "webhook_raw = ?",
    "updated_at = ?",
  ];
  const values: unknown[] = [
    rawStatus || (api.fulfillmentStatus ?? null),
    stamp,
    JSON.stringify(history),
    JSON.stringify(payload),
    stamp,
  ];

  if (tracking) { sets.push("tracking_number = ?"); values.push(tracking); }
  if (courier) { sets.push("courier = ?"); values.push(courier); }
  if (trackingUrl) { sets.push("tracking_url = ?"); values.push(trackingUrl); }
  if (ndrReason) { sets.push("ndr_reason = ?"); values.push(ndrReason); }
  if (easyecomOrderId && !api.easyecomOrderId) { sets.push("easyecom_order_id = ?"); values.push(easyecomOrderId); }
  if (mapped) { sets.push("status = ?"); values.push(mapped); }

  values.push(api.id);
  await pool.query(`UPDATE \`orders\` SET ${sets.join(", ")} WHERE id = ?`, values);

  return {
    matched: true,
    orderId: String(api.id),
    orderNumber: String(api.orderNumber ?? ""),
    status: mapped ?? rawStatus,
  };
}

/** Apply one payload or an array/batched payload; returns per-item results. */
export async function applyEasyEcomWebhook(body: unknown): Promise<ApplyResult[]> {
  const items: Payload[] = Array.isArray(body)
    ? (body as Payload[])
    : Array.isArray((body as Payload)?.orders)
      ? ((body as Payload).orders as Payload[])
      : [body as Payload];

  const results: ApplyResult[] = [];
  for (const item of items) {
    if (item && typeof item === "object") {
      try {
        results.push(await applyEasyEcomStatus(item));
      } catch (err) {
        console.error("[easyecom/webhook] apply failed:", (err as Error)?.message);
        results.push({ matched: false });
      }
    }
  }
  return results;
}
