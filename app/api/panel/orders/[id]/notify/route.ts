import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/panelCrud";
import { notifyOrderConfirmed, isOrderWhatsappConfigured, orderCampaign } from "@/lib/orderNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Panel "Send WhatsApp confirmation" — (re)send the order-confirmation message
 * for ONE order. `force` bypasses the once-only guard, so this is the button to
 * press when a message failed (AiSensy down, wrong number fixed since) or the
 * customer says they never got it.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  if (!isOrderWhatsappConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message: "WhatsApp is not configured — set AISENSY_API_KEY and AISENSY_ORDER_CAMPAIGN.",
      },
      { status: 503 }
    );
  }

  const { id } = await params;
  const force = new URL(req.url).searchParams.get("force") !== "0";

  try {
    const res = await notifyOrderConfirmed(decodeURIComponent(id), { force });
    if (res.sent) {
      return NextResponse.json({
        success: true,
        message: `Confirmation sent on WhatsApp to ${res.destination} (campaign ${orderCampaign()}).`,
        ...res,
      });
    }
    const why =
      res.skipped === "already-sent"
        ? "Already sent — nothing to do."
        : res.skipped === "no-number"
          ? "This order has no mobile number to message."
          : res.skipped === "no-order"
            ? "Order not found."
            : (res.error ?? "WhatsApp send failed.");
    return NextResponse.json({ success: false, message: why, ...res }, { status: 422 });
  } catch (err) {
    console.error("[panel orders/notify] failed:", err);
    return NextResponse.json({ success: false, message: "Send failed. Please try again." }, { status: 500 });
  }
}
