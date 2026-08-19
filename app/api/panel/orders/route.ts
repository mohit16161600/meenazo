import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { collectionHandlers, requireAccess } from "@/lib/panelCrud";
import { MODELS, ORDER_STATUSES } from "@/lib/panelModels";
import { rowToApi } from "@/lib/panelMap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = collectionHandlers("orders");
export const POST = handlers.POST;

/**
 * Orders list with ADVANCED filtering — the panel's "find that order" surface.
 *
 * Query params (all optional, all combinable):
 *   q        free text: order number, customer name, phone, city, state, pincode
 *   status   one of ORDER_STATUSES
 *   payment  prepaid | partial | cod   (derived from amount_paid vs total)
 *   from,to  YYYY-MM-DD, inclusive, on created_at
 *   min,max  order-total range
 *   synced   1 | 0 — pushed to EasyEcom or still queued
 *   sort     serial (default) | newest | oldest | high | low
 */
/**
 * Serial S.No (id) IS the insertion order, so it drives newest/oldest.
 *
 * `serial` is the default and the owner's requested view: the newest order sits
 * at the BOTTOM, like a hand-kept register. It still SELECTs newest-first —
 * otherwise `LIMIT 200` would return the oldest 200 rows and brand-new orders
 * would silently vanish off the page — and the rows are reversed before they go
 * out, so the page shows the most recent orders in ascending S.No order.
 */
const SORTS: Record<string, string> = {
  serial: "id DESC",
  newest: "id DESC",
  oldest: "id ASC",
  high: "total DESC",
  low: "total ASC",
};
const DEFAULT_SORT = "serial";

const clampInt = (v: unknown, min: number, max: number, dflt: number): number => {
  // An ABSENT param has to take the default, and `Number(null)` / `Number("")`
  // are both 0 — not NaN — so without this line every caller that omitted
  // ?limit got clamped to the minimum instead. For this route that meant the
  // orders list silently returned ONE order.
  if (v === null || v === undefined || v === "") return dflt;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};

export async function GET(req: Request) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  const p = new URL(req.url).searchParams;
  const q = (p.get("q") ?? "").trim();
  const status = (p.get("status") ?? "").trim();
  const payment = (p.get("payment") ?? "").trim();
  const from = (p.get("from") ?? "").trim();
  const to = (p.get("to") ?? "").trim();
  const min = p.get("min");
  const max = p.get("max");
  const synced = p.get("synced");
  const sortKey = SORTS[p.get("sort") ?? ""] ? (p.get("sort") as string) : DEFAULT_SORT;
  const sort = SORTS[sortKey];

  // One code path for every request — the generic handler can't express the
  // "newest N, shown oldest-first" view, and delegating to it would hide new
  // orders behind the LIMIT.
  const where: string[] = [];
  const params: unknown[] = [];

  if (q) {
    const like = `%${q}%`;
    const cols = [
      "order_number",
      "customer_name",
      "customer_mobile",
      "shipping_phone",
      "city",
      "state",
      "pincode",
    ];
    const parts = cols.map((c) => `\`${c}\` LIKE ?`);
    cols.forEach(() => params.push(like));
    // A pasted "+91 98765 43210" must still find "9876543210".
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 6) {
      const tail = `%${digits.slice(-10)}%`;
      parts.push("`customer_mobile` LIKE ?", "`shipping_phone` LIKE ?");
      params.push(tail, tail);
    }
    where.push(`(${parts.join(" OR ")})`);
  }

  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    where.push("status = ?");
    params.push(status);
  }

  // Payment TYPE is derived, not stored — keep the SQL in step with
  // lib/paymentType.ts so the filter and the badges never disagree.
  if (payment === "cod") where.push("COALESCE(amount_paid, 0) <= 0");
  else if (payment === "prepaid") where.push("(amount_paid IS NOT NULL AND amount_paid > 0 AND amount_paid >= total)");
  else if (payment === "partial") where.push("(amount_paid IS NOT NULL AND amount_paid > 0 AND amount_paid < total)");

  if (from) {
    where.push("created_at >= ?");
    params.push(`${from}T00:00:00.000Z`);
  }
  if (to) {
    where.push("created_at <= ?");
    params.push(`${to}T23:59:59.999Z`);
  }
  if ((min ?? "") !== "") {
    where.push("total >= ?");
    params.push(clampInt(min, 0, 100_000_000, 0));
  }
  if ((max ?? "") !== "") {
    where.push("total <= ?");
    params.push(clampInt(max, 0, 100_000_000, 100_000_000));
  }
  if (synced === "1") where.push("easyecom_synced = 1");
  if (synced === "0") where.push("easyecom_synced = 0");

  const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const limit = clampInt(p.get("limit"), 1, 500, 50);
  const offset = clampInt(p.get("offset"), 0, 1_000_000, 0);

  try {
    const pool = getPanelPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM \`orders\`${whereSql} ORDER BY ${sort} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const [agg] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END),0) AS revenue FROM \`orders\`${whereSql}`,
      params
    );
    // The default view selected newest-first so the LIMIT keeps the RECENT
    // orders; flip it here so the table reads 1, 2, 3 … with the latest last.
    const items = rows.map((r) => rowToApi(MODELS.orders, r));
    if (sortKey === "serial") items.reverse();
    return NextResponse.json({
      success: true,
      items,
      total: Number(agg[0]?.n ?? 0),
      // Value of the CURRENT filter, so "all COD in Delhi" reports its own total.
      revenue: Number(agg[0]?.revenue ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error("[panel orders list] filter failed:", err);
    return NextResponse.json({ success: false, message: "Could not load orders." }, { status: 500 });
  }
}
