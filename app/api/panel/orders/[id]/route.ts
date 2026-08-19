import { NextResponse } from "next/server";
import { itemHandlers, requireAccess } from "@/lib/panelCrud";
import { getPanelPool } from "@/lib/panelDb";
import { cancelOrderEverywhere } from "@/lib/easyecomDispatch";
import { revertPrepaidPricingIfUnpaid, recomputeOrderTotals } from "@/lib/orderCapture";
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
  let becomingCod = false;
  let ownTotal = false;
  let touchedItems = false;
  try {
    const body = (await req.clone().json()) as {
      status?: unknown;
      paymentMethod?: unknown;
      total?: unknown;
      items?: unknown;
    };
    becomingCod = String(body?.paymentMethod ?? "").toLowerCase() === "cod";
    touchedItems = Array.isArray(body?.items);

    if (becomingCod || String(body?.status ?? "").toLowerCase() === "cancelled") {
      const [rows] = await getPanelPool().query<RowDataPacket[]>(
        "SELECT status, total FROM `orders` WHERE id = ? LIMIT 1",
        [orderId]
      );
      becomingCancelled =
        String(body?.status ?? "").toLowerCase() === "cancelled" &&
        !!rows[0] &&
        String(rows[0].status ?? "").toLowerCase() !== "cancelled";

      // Did the owner TYPE a total of their own in this save? The order form
      // does send `total` on every save, so merely finding the key present
      // means nothing — it has to differ from what is already stored. Getting
      // this wrong is what silently disabled the re-pricing below.
      ownTotal =
        body?.total !== undefined &&
        body?.total !== null &&
        String(body.total) !== "" &&
        Number(body.total) !== Number(rows[0]?.total ?? NaN);
    }
  } catch {
    /* unreadable body — let the normal handler reject it */
  }

  const res = await handlers.PUT(req, ctx);

  // Moved to Cash on Delivery by hand: the pay-online discount goes with it,
  // since it was only ever earned by paying up front. A no-op once any money
  // is recorded against the order.
  if (becomingCod && !ownTotal && res.ok) {
    try {
      await revertPrepaidPricingIfUnpaid(orderId, "switched to Cash on Delivery in the panel");
    } catch (err) {
      console.error("[panel orders PUT] prepaid revert failed:", err);
    }
  }

  // Line items were edited: re-derive the money from them, so a quantity change
  // can't leave the total (and what the courier collects) behind. Skipped when
  // the owner typed their own total in the same save.
  if (touchedItems && !ownTotal && res.ok) {
    try {
      await recomputeOrderTotals(orderId);
    } catch (err) {
      console.error("[panel orders PUT] total recompute failed:", err);
    }
  }

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
