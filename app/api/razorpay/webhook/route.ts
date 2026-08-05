import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import {
  isRazorpayConfigured,
  isRazorpayWebhookConfigured,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";
import {
  confirmOrderPaidOnce,
  findOrderIdByRazorpayOrderId,
  recordPaymentFailure,
  recordRefund,
  type OrderNotes,
} from "@/lib/orderCapture";
import { notifyOrderConfirmedSafe } from "@/lib/orderNotify";
import { markCartConverted } from "@/lib/customerStore";
import { getPanelPool } from "@/lib/panelDb";

/**
 * Razorpay webhook — the server-to-server safety net.
 * ---------------------------------------------------------------------------
 * /api/razorpay/verify only runs while the customer's browser is still open.
 * If they pay and immediately close the tab (or the network dies, or the UPI
 * app takes 40s to come back), that call never happens and a REAL PAID order
 * would sit "pending" forever — never shipped, never confirmed by WhatsApp.
 *
 * Razorpay also POSTs every payment event here, signed with the WEBHOOK secret
 * over the RAW body. So this route is the one that guarantees a paid order gets
 * confirmed, exactly once, no matter what the browser did.
 *
 * Setup (Dashboard → Settings → Webhooks):
 *   URL     https://<your-domain>/api/razorpay/webhook
 *   Secret  the same string as RAZORPAY_WEBHOOK_SECRET
 *   Events  payment.captured, payment.failed, order.paid, refund.processed
 *
 * Always answers 200 on anything it understood — a non-2xx makes Razorpay
 * retry-storm for days. Only a bad/missing signature is rejected.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RzpEntity {
  id?: string;
  order_id?: string;
  payment_id?: string;
  amount?: number;
  status?: string;
  method?: string;
  error_code?: string;
  error_description?: string;
  notes?: Record<string, string>;
}

interface RzpEvent {
  event?: string;
  payload?: {
    payment?: { entity?: RzpEntity };
    order?: { entity?: RzpEntity };
    refund?: { entity?: RzpEntity };
  };
}

function parseNotes(raw: unknown): OrderNotes {
  try {
    return raw ? (JSON.parse(String(raw)) as OrderNotes) : {};
  } catch {
    return {};
  }
}

/**
 * Resolve OUR order id for an event. The internal id travels in the Razorpay
 * order's `notes.orderId` (we put it there at create time); the lookup by
 * Razorpay order id is the fallback for anything that lost its notes.
 */
async function resolveOrderId(payment?: RzpEntity, order?: RzpEntity): Promise<string | null> {
  const fromNotes = String(payment?.notes?.orderId ?? order?.notes?.orderId ?? "").trim();
  if (fromNotes) return fromNotes;
  const rzpOrderId = String(payment?.order_id ?? order?.id ?? "").trim();
  return rzpOrderId ? findOrderIdByRazorpayOrderId(rzpOrderId) : null;
}

export async function POST(req: Request) {
  // Read the RAW body — the signature is over these exact bytes.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!isRazorpayWebhookConfigured()) {
    // Refuse rather than accept unverifiable money events.
    console.error("[RZP webhook] RAZORPAY_WEBHOOK_SECRET is not set — event ignored.");
    return NextResponse.json({ success: false, message: "Webhook not configured." }, { status: 503 });
  }
  if (!verifyRazorpayWebhookSignature(raw, signature)) {
    return NextResponse.json({ success: false, message: "Invalid signature." }, { status: 400 });
  }

  let event: RzpEvent;
  try {
    event = JSON.parse(raw) as RzpEvent;
  } catch {
    return NextResponse.json({ success: true, message: "Unparseable payload ignored." });
  }

  const kind = String(event.event ?? "");
  const payment = event.payload?.payment?.entity;
  const order = event.payload?.order?.entity;
  const refund = event.payload?.refund?.entity;

  try {
    switch (kind) {
      /* ---- Money is in: confirm the order (idempotent) ---- */
      case "payment.captured":
      case "order.paid": {
        const orderId = await resolveOrderId(payment, order);
        if (!orderId) {
          console.error(`[RZP webhook] ${kind}: no matching order for`, payment?.order_id ?? order?.id);
          return NextResponse.json({ success: true, message: "No matching order." });
        }

        const pool = getPanelPool();
        const [rows] = await pool.query<RowDataPacket[]>(
          "SELECT id, notes, customer_mobile, payment_method, status FROM `orders` WHERE id = ? LIMIT 1",
          [orderId]
        );
        const row = rows[0];
        if (!row) return NextResponse.json({ success: true, message: "Order gone." });

        const notes = parseNotes(row.notes);
        const signedOrderId = String(payment?.order_id ?? order?.id ?? "");
        // Same guard as /verify: never confirm order A with a payment for order B.
        if (signedOrderId && notes.razorpay?.orderId && notes.razorpay.orderId !== signedOrderId) {
          console.error(`[RZP webhook] ${kind}: order id mismatch for ${orderId}`);
          return NextResponse.json({ success: true, message: "Order id mismatch." });
        }

        const paymentId = String(payment?.id ?? notes.razorpay?.paymentId ?? "");
        const won = await confirmOrderPaidOnce(orderId, paymentId, notes, { method: payment?.method });

        if (won) {
          try {
            await markCartConverted(String(row.customer_mobile ?? ""));
          } catch {
            /* non-fatal */
          }
        }
        // Always attempt the message: notifyOrderConfirmed is itself once-only,
        // so this also covers "payment confirmed by /verify but WhatsApp failed".
        const notify = await notifyOrderConfirmedSafe(orderId);
        return NextResponse.json({ success: true, confirmed: won, whatsapp: notify.sent });
      }

      /* ---- Declined attempt: keep the order pending, record why ---- */
      case "payment.failed": {
        const orderId = await resolveOrderId(payment, order);
        if (orderId) {
          await recordPaymentFailure(orderId, {
            paymentId: payment?.id,
            code: payment?.error_code,
            description: payment?.error_description,
            method: payment?.method,
          });
        }
        return NextResponse.json({ success: true, recorded: Boolean(orderId) });
      }

      /* ---- Refund: audit trail only, the money moves at Razorpay ---- */
      case "refund.created":
      case "refund.processed": {
        const orderId = await resolveOrderId(
          { ...payment, order_id: payment?.order_id ?? order?.id },
          order
        );
        if (orderId) {
          await recordRefund(orderId, {
            refundId: refund?.id,
            paymentId: refund?.payment_id ?? payment?.id,
            amount: typeof refund?.amount === "number" ? refund.amount / 100 : undefined,
            status: refund?.status,
          });
        }
        return NextResponse.json({ success: true, recorded: Boolean(orderId) });
      }

      default:
        // Subscribed to something we don't act on — acknowledge so it isn't retried.
        return NextResponse.json({ success: true, ignored: kind });
    }
  } catch (err) {
    // The payment is already real at Razorpay; log loudly but still 200 so the
    // retry storm doesn't start. The next event (or the panel) will reconcile.
    console.error(`[RZP webhook] ${kind} handling failed:`, err);
    return NextResponse.json({ success: true, message: "Logged." });
  }
}

/** GET is handy for "is the URL reachable?" checks in the Razorpay dashboard. */
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "razorpay-webhook",
    keysConfigured: isRazorpayConfigured(),
    webhookConfigured: isRazorpayWebhookConfigured(),
    message: "POST signed Razorpay events here.",
  });
}
