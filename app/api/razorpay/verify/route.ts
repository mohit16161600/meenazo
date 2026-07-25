import { NextResponse } from "next/server";
import { verifyRazorpaySignature, isRazorpayConfigured } from "@/lib/razorpay";
import { confirmOrderPaidOnce, type OrderNotes } from "@/lib/orderCapture";
import { getRow } from "@/lib/panelCrud";
import { MODELS } from "@/lib/panelModels";
import { markCartConverted } from "@/lib/customerStore";

/**
 * Razorpay payment verification.
 * ---------------------------------------------------------------------------
 * 1) Cryptographically verify the checkout callback signature (HMAC-SHA256 of
 *    `${order_id}|${payment_id}` with the key secret) — proves the payment is
 *    genuine and untampered.
 * 2) Confirm the signed Razorpay order id matches the one WE stored on the
 *    internal order (blocks confirming order A with a payment for order B).
 * 3) Flip the order to "confirmed". Once paid, the dispatch worker pushes it to
 *    EasyEcom after the hold window (prepaid orders are only fulfilled once paid).
 *
 * The money is already captured once the signature verifies, so DB hiccups are
 * logged and treated as best-effort rather than failing the customer.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  internalOrderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

function parseNotes(raw: unknown): OrderNotes {
  try {
    return raw ? (JSON.parse(String(raw)) as OrderNotes) : {};
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { success: false, message: "Online payment is not configured." },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const internalOrderId = String(body.internalOrderId ?? "").trim();
  const razorpayOrderId = String(body.razorpayOrderId ?? "").trim();
  const razorpayPaymentId = String(body.razorpayPaymentId ?? "").trim();
  const razorpaySignature = String(body.razorpaySignature ?? "").trim();

  // 1) Signature — the authoritative proof the payment is genuine.
  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return NextResponse.json(
      { success: false, message: "Payment verification failed. If money was deducted it will be refunded." },
      { status: 400 }
    );
  }

  // 2) Reconcile with the order we recorded (best-effort against DB availability).
  let orderNumber: string | undefined;
  let total: number | undefined;
  try {
    const row = internalOrderId ? await getRow(MODELS.orders, internalOrderId) : null;
    if (row) {
      const storedNotes = parseNotes(row.notes);
      if (row.paymentMethod !== "razorpay" || storedNotes.razorpay?.orderId !== razorpayOrderId) {
        // Valid payment, but it does not belong to this order — refuse to confirm it.
        return NextResponse.json(
          { success: false, message: "Payment could not be matched to your order." },
          { status: 400 }
        );
      }

      orderNumber = row.orderNumber as string | undefined;
      total = row.total as number | undefined;

      // Atomic pending -> confirmed; only the FIRST concurrent/replayed verify
      // wins. Once confirmed, the EasyEcom dispatch worker will fulfill it.
      const won = await confirmOrderPaidOnce(internalOrderId, razorpayPaymentId, storedNotes);
      if (won) {
        // Paid — the customer's live cart is no longer "abandoned".
        try {
          await markCartConverted(String(row.customerMobile ?? ""));
        } catch {
          /* non-fatal */
        }
      }
    }
  } catch (err) {
    // Payment is verified/captured; a DB blip here just defers the status flip.
    console.error("[RZP] verify: order reconcile failed (payment still captured):", err);
  }

  return NextResponse.json({ success: true, message: "Payment verified", orderNumber, total });
}
