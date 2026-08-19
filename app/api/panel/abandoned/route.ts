import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";
import { ensureAbandonedTable, sweepAbandonedCarts } from "@/lib/abandonedCarts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The abandoned cart / checkout recovery list.
 *
 * Gated with `orders` rather than `customers`: these rows carry order numbers
 * and money, which is the same data class as the orders screen.
 *
 * The sweep is run HERE, on load, as well as on the background dispatch tick.
 * That tick only exists when EASYECOM_DISPATCH_SECRET is set, and the owner
 * opening this page must never be shown a stale (or empty) list because of a
 * cron that was never configured. It is idempotent, so the extra call only
 * ever picks up what has gone cold since the last one.
 */
export async function GET(req: Request) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  try {
    await ensureAbandonedTable();
  } catch (err) {
    console.error("[panel abandoned] table init failed:", err);
    return NextResponse.json(
      { success: false, message: "Could not reach the database." },
      { status: 500 }
    );
  }

  // Best-effort: a failing sweep must still render whatever is already logged.
  try {
    await sweepAbandonedCarts();
  } catch (err) {
    console.error("[panel abandoned] sweep failed:", err);
  }

  const pool = getPanelPool();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  // Floored as well as clamped: this is interpolated into the SQL, and a
  // fractional `LIMIT 50.5` is a syntax error, not a smaller page.
  const limitParam = Math.floor(Number(url.searchParams.get("limit") ?? 500));
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 2000) : 500;

  const params: unknown[] = [];
  let where = "";
  if (q) {
    where =
      "WHERE a.phone LIKE ? OR a.customer_name LIKE ? OR a.order_number LIKE ? OR a.customer_email LIKE ? ";
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  let rows: RowDataPacket[] = [];
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      "SELECT a.*, " +
        // How many OTHER orders this number has placed — tells a first-timer
        // apart from a regular before anyone picks up the phone. The abandoned
        // checkout itself is excluded, or every one of them would read as a
        // customer who has ordered before.
        "(SELECT COUNT(*) FROM `orders` o WHERE o.customer_mobile = a.phone AND o.status <> 'cancelled' " +
        " AND (a.order_id IS NULL OR o.id <> a.order_id)) AS orders_count " +
        `FROM \`abandoned_carts\` a ${where}ORDER BY a.id DESC LIMIT ${limit}`,
      params
    );
    rows = result;
  } catch (err) {
    console.error("[panel abandoned] query failed:", err);
    return NextResponse.json(
      { success: false, message: "Could not load the abandoned list." },
      { status: 500 }
    );
  }

  const items = rows.map((r) => {
    let parsed: unknown[] = [];
    try {
      const j = r.items ? JSON.parse(String(r.items)) : [];
      if (Array.isArray(j)) parsed = j;
    } catch {
      /* unreadable snapshot — show the row without its line items */
    }
    return {
      id: String(r.id),
      phone: String(r.phone ?? ""),
      customerName: r.customer_name ?? null,
      customerEmail: r.customer_email ?? null,
      stage: String(r.stage ?? "cart"),
      items: parsed,
      itemCount: Number(r.item_count ?? 0),
      subtotal: Number(r.subtotal ?? 0),
      value: Number(r.value ?? 0),
      couponCode: r.coupon_code ?? null,
      orderId: r.order_id ?? null,
      orderNumber: r.order_number ?? null,
      city: r.city ?? null,
      state: r.state ?? null,
      pincode: r.pincode ?? null,
      paymentMethod: r.payment_method ?? null,
      source: r.source ?? null,
      ip: r.ip ?? null,
      lastActivityAt: r.last_activity_at ?? null,
      abandonedAt: r.abandoned_at ?? null,
      recovered: Number(r.recovered ?? 0) === 1,
      recoveredAt: r.recovered_at ?? null,
      recoveredOrderNumber: r.recovered_order_number ?? null,
      ordersCount: Number(r.orders_count ?? 0),
    };
  });

  return NextResponse.json({ success: true, items });
}
