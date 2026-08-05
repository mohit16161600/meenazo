import { NextResponse } from "next/server";
import { requireAccess, getRow } from "@/lib/panelCrud";
import { MODELS } from "@/lib/panelModels";
import { fetchRazorpayOrderPayments, isRazorpayConfigured } from "@/lib/razorpay";
import { confirmOrderPaidOnce, type OrderNotes } from "@/lib/orderCapture";
import { notifyOrderConfirmedSafe } from "@/lib/orderNotify";
import { markCartConverted } from "@/lib/customerStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Panel "Check payment with Razorpay" — ask Razorpay directly whether this
 * order was actually paid, and confirm it if so.
 *
 * The manual counterpart to the webhook: for "maine payment kiya but order
 * pending dikha raha hai" the owner presses this instead of trusting a
 * screenshot. Razorpay's own record is the only thing that can flip the order
 * to paid, and confirmation is the same once-only path used everywhere else.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { success: false, message: "Razorpay keys are not configured on this server." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const orderId = decodeURIComponent(id);

  try {
    const row = await getRow(MODELS.orders, orderId);
    if (!row) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });

    let notes: OrderNotes = {};
    try {
      notes = row.notes ? (JSON.parse(String(row.notes)) as OrderNotes) : {};
    } catch {
      /* unreadable notes — handled below */
    }
    const rzpOrderId = notes.razorpay?.orderId;
    if (!rzpOrderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order has no Razorpay order attached — it was never started as an online payment (COD orders can't be checked).",
        },
        { status: 422 }
      );
    }

    const payments = await fetchRazorpayOrderPayments(rzpOrderId);
    const captured = payments.find((p) => p.status === "captured");

    if (!captured) {
      const attempted = payments.length;
      const failed = payments.filter((p) => p.status === "failed").length;
      return NextResponse.json(
        {
          success: false,
          paid: false,
          message: attempted
            ? `Razorpay shows ${attempted} attempt(s) on this order but NONE captured (${failed} failed). No money was collected — leave it as Cash on Delivery or ask the customer to pay again.`
            : "Razorpay shows no payment attempt at all on this order. Nothing was collected.",
        },
        { status: 422 }
      );
    }

    const won = await confirmOrderPaidOnce(orderId, String(captured.id ?? ""), notes, {
      method: captured.method,
    });
    if (won) {
      try {
        await markCartConverted(String(row.customerMobile ?? ""));
      } catch {
        /* non-fatal */
      }
    }
    const notify = await notifyOrderConfirmedSafe(orderId);

    return NextResponse.json({
      success: true,
      paid: true,
      confirmed: won,
      whatsapp: notify.sent,
      message:
        `Razorpay confirms ₹${Math.round((captured.amount ?? 0) / 100)} captured via ${captured.method ?? "online"} (${captured.id}). ` +
        (won ? "Order marked as paid." : "Order was already marked as paid.") +
        (notify.sent ? " WhatsApp confirmation sent." : ""),
    });
  } catch (err) {
    console.error("[panel orders/verify-payment] failed:", err);
    return NextResponse.json(
      { success: false, message: (err as Error)?.message ?? "Could not reach Razorpay. Please try again." },
      { status: 502 }
    );
  }
}
