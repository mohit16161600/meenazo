import { NextResponse } from "next/server";
import { itemHandlers, requireAccess } from "@/lib/panelCrud";
import { getPanelPool } from "@/lib/panelDb";
import { cancelOrderEverywhere } from "@/lib/easyecomDispatch";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = itemHandlers("orders");

export const GET = handlers.GET;
export const DELETE = handlers.DELETE;

/**
 * Standard order update, PLUS: switching the status to "cancelled" here must
 * behave exactly like the Cancel button — an order already pushed to EasyEcom
 * has to be cancelled THERE too, or it quietly ships anyway. Without this the
 * status dropdown would be a silent trap.
 */
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  const { id } = await ctx.params;
  const orderId = decodeURIComponent(id);

  let becomingCancelled = false;
  try {
    const body = (await req.clone().json()) as { status?: unknown };
    if (String(body?.status ?? "").toLowerCase() === "cancelled") {
      const [rows] = await getPanelPool().query<RowDataPacket[]>(
        "SELECT status FROM `orders` WHERE id = ? LIMIT 1",
        [orderId]
      );
      becomingCancelled =
        !!rows[0] && String(rows[0].status ?? "").toLowerCase() !== "cancelled";
    }
  } catch {
    /* unreadable body — let the normal handler reject it */
  }

  const res = await handlers.PUT(req, ctx);

  if (becomingCancelled && res.ok) {
    try {
      const r = await cancelOrderEverywhere(orderId);
      if (r.easyecomError) {
        const data = (await res.json()) as Record<string, unknown>;
        return NextResponse.json({
          ...data,
          warning: true,
          message: `Saved, but EasyEcom refused the cancel: ${r.easyecomError} — cancel it in EasyEcom by hand.`,
        });
      }
    } catch (err) {
      console.error("[panel orders PUT] EasyEcom cancel failed:", err);
    }
  }
  return res;
}
