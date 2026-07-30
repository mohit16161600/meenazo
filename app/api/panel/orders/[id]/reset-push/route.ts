import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clear an order's EasyEcom push state so it re-enters the dispatch queue.
 *
 * The push fields are immutable through the normal CRUD API (they are the
 * system's own audit trail), so this is the ONLY way to undo a wrong
 * "pushed" mark — e.g. one set by hand before those fields were locked, or an
 * order EasyEcom later rejected. Pushing again after a REAL push would create
 * a duplicate order, so the UI confirms loudly before calling this.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  const { id } = await params;
  const orderId = decodeURIComponent(id);
  const pool = getPanelPool();

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, order_number, easyecom_log FROM `orders` WHERE id = ? LIMIT 1",
      [orderId]
    );
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    // Keep the history — append a marker rather than wiping the audit trail.
    let log: unknown[] = [];
    try {
      const parsed = row.easyecom_log ? JSON.parse(String(row.easyecom_log)) : [];
      if (Array.isArray(parsed)) log = parsed;
    } catch {
      /* unreadable log — start a fresh one */
    }
    const stamp = new Date().toISOString();
    log = [...log, { at: stamp, ok: false, error: "Push state reset by an admin — order re-queued.", reset: true }].slice(-10);

    await pool.query(
      "UPDATE `orders` SET easyecom_synced = 0, easyecom_ref = NULL, easyecom_pushed_at = NULL, " +
        "easyecom_attempts = 0, easyecom_error = NULL, easyecom_log = ?, updated_at = ? WHERE id = ?",
      [JSON.stringify(log), stamp, orderId]
    );

    return NextResponse.json({
      success: true,
      message: `Order ${String(row.order_number ?? orderId)} re-queued for EasyEcom.`,
    });
  } catch (err) {
    console.error("[panel orders/reset-push] failed:", err);
    return NextResponse.json(
      { success: false, message: "Could not reset the push state." },
      { status: 500 }
    );
  }
}
