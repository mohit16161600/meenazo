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
 *   sort     newest | oldest | high | low
 *
 * With no filters it delegates to the generic handler, so existing list pages
 * and pagination behave exactly as before.
 */
const SORTS: Record<string, string> = {
  newest: "created_at DESC",
  oldest: "created_at ASC",
  high: "total DESC",
  low: "total ASC",
};

const clampInt = (v: unknown, min: number, max: number, dflt: number): number => {
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
  const sort = SORTS[p.get("sort") ?? "newest"] ?? SORTS.newest;

  // A non-default sort counts as a filter: the generic handler only knows the
  // model's own defaultSort, so delegating would silently drop the sort.
  const sortKey = p.get("sort") ?? "newest";
  const hasFilter = Boolean(
    q ||
      status ||
      payment ||
      from ||
      to ||
      (min ?? "") !== "" ||
      (max ?? "") !== "" ||
      synced ||
      (sortKey !== "newest" && SORTS[sortKey])
  );
  if (!hasFilter) return handlers.GET(req);

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
    return NextResponse.json({
      success: true,
      items: rows.map((r) => rowToApi(MODELS.orders, r)),
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
