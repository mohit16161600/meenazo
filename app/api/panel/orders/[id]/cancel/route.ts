import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/panelCrud";
import { cancelOrderEverywhere } from "@/lib/easyecomDispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cancel an order locally AND in EasyEcom (when it was already pushed).
 * Used by the panel's "Cancel order" button; the plain status-dropdown save
 * routes through here too (see ../route.ts).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  const { id } = await params;
  try {
    const r = await cancelOrderEverywhere(decodeURIComponent(id));
    if (!r.cancelled) {
      return NextResponse.json({ success: false, message: r.easyecomError ?? "Cancel failed." }, { status: 404 });
    }
    const message = r.wasNotPushed
      ? `Order ${r.orderNumber} cancelled. It had not reached EasyEcom, so nothing to cancel there.`
      : r.easyecomCancelled
        ? `Order ${r.orderNumber} cancelled here and in EasyEcom.`
        : `Order ${r.orderNumber} cancelled here, but EasyEcom refused: ${r.easyecomError} — cancel it in EasyEcom by hand.`;
    // Local cancel always succeeded; flag the EasyEcom half separately so the
    // UI can warn instead of implying everything is done.
    return NextResponse.json({ success: true, warning: Boolean(r.easyecomError), message, ...r });
  } catch (err) {
    console.error("[panel orders/cancel] failed:", err);
    return NextResponse.json({ success: false, message: "Cancel failed. Please try again." }, { status: 500 });
  }
}
