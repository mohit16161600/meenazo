import { NextResponse } from "next/server";
import { captureOrder } from "@/lib/orderCapture";
import { clientIp } from "@/lib/clientIp";
import { getCustomerSession } from "@/lib/customerAuth";
import { markCartConverted, getCustomerByPhone } from "@/lib/customerStore";
import { notifyOrderConfirmedSafe } from "@/lib/orderNotify";

/**
 * COD order endpoint — next-level order capture.
 * ---------------------------------------------------------------------------
 * The full order (every product with its SKU, variety, quantity, unit price,
 * line total, offer/coupon, totals, address, ip, source) is saved as ONE row
 * in the LOCAL panel database `orders` table — server-side priced — and given
 * a sequential fulfillment number (mpl0001, mpl0002, …).
 *
 * Orders are NO LONGER mirrored into the CRM `enquiry` table. Instead they are
 * pushed to EasyEcom for fulfillment after a hold window (default 3h) by the
 * dispatch worker (lib/easyecomDispatch.ts) — see instrumentation.ts and
 * /api/easyecom/dispatch.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CodItem {
  product?: string;
  variant?: string;
  quantity?: number;
}
interface CodBody {
  name?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  coupon?: string;
  /** Accepted for backwards compatibility but IGNORED — this route is COD only. */
  paymentMethod?: string;
  items?: CodItem[];
  product?: string; // single-product shorthand
}

export async function POST(req: Request) {
  // Login required — the customer must be signed in to order.
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Please log in to place your order.", needsLogin: true },
      { status: 401 }
    );
  }
  // ...and the phone must be OTP-verified (registering/email-login alone can't
  // prove ownership of the number an order is placed under).
  if (!session.verified) {
    return NextResponse.json(
      { success: false, message: "Please verify your mobile number with an OTP to place an order.", needsOtp: true },
      { status: 403 }
    );
  }
  // The cookie alone is never enough — the account must still exist in the DB
  // and be OTP-verified THERE. A stale cookie for a deleted/unverified account
  // cannot place an order. Fails closed on DB errors (orders live in the same
  // DB anyway).
  let account: Awaited<ReturnType<typeof getCustomerByPhone>>;
  try {
    account = await getCustomerByPhone(session.phone);
  } catch (err) {
    console.error("[COD] account check failed:", err);
    return NextResponse.json(
      { success: false, message: "Could not verify your account. Please try again." },
      { status: 500 }
    );
  }
  if (!account) {
    return NextResponse.json(
      { success: false, message: "Your session is no longer valid. Please log in again.", needsLogin: true },
      { status: 401 }
    );
  }
  if (!Number(account.verified)) {
    return NextResponse.json(
      { success: false, message: "Please verify your mobile number with an OTP to place an order.", needsOtp: true },
      { status: 403 }
    );
  }

  let body: CodBody;
  try {
    body = (await req.json()) as CodBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = String(body.name ?? "").trim();
  // The signed-in phone is authoritative — number is the primary identity.
  const mobile = session.phone;
  const address = String(body.address ?? "").trim();
  const state = String(body.state ?? "").trim();
  let items: CodItem[] = Array.isArray(body.items) ? body.items : [];

  // Single-product shorthand: { "product": "slimpax" }
  if (items.length === 0 && body.product) {
    items = [{ product: body.product, quantity: 1 }];
  }

  // ---- Validate (mirrors the original cod.php contract) ----
  const errors: string[] = [];
  if (name === "") errors.push("name is required");
  if (mobile.length < 10) errors.push("valid mobile is required");
  if (address === "") errors.push("address is required");
  if (state === "") errors.push("state is required");
  if (items.length === 0) errors.push("at least one product is required");
  if (errors.length) {
    return NextResponse.json(
      { success: false, message: errors.join(", ") },
      { status: 422 }
    );
  }

  const ip = clientIp(req);

  // ---- Capture the full-detail order (server-side priced) ----
  let local: Awaited<ReturnType<typeof captureOrder>>;
  try {
    local = await captureOrder({
      name,
      mobile,
      // The number typed on the checkout form is the DELIVERY contact; the
      // session phone stays the account identity.
      shippingPhone: String(body.mobile ?? "").trim() || undefined,
      address,
      city: String(body.city ?? "").trim() || undefined,
      state,
      pincode: String(body.pincode ?? "").trim() || undefined,
      email: String(body.email ?? "").trim() || undefined,
      items: items.map((i) => ({
        product: String(i.product ?? ""),
        variant: i.variant ? String(i.variant) : undefined,
        quantity: Number(i.quantity ?? 1),
      })),
      coupon: body.coupon ? String(body.coupon) : undefined,
      // HARDCODED, never taken from the request. The payment method now decides
      // the price (prepaid orders get an instant discount), so accepting a
      // client-supplied "razorpay" here would hand out the prepaid discount on
      // an order where nothing is actually paid up front. Online payments have
      // their own route, which only prices after Razorpay has the money.
      paymentMethod: "cod",
      ip,
      source: "website",
    });
  } catch (err) {
    const e = err as { code?: string; message?: string; skipped?: string[] };
    if (e.code === "NO_ITEMS") {
      return NextResponse.json(
        { success: false, message: "No valid products to record", skipped: e.skipped ?? [] },
        { status: 422 }
      );
    }
    console.error("[COD] order capture failed:", err);
    return NextResponse.json(
      { success: false, message: "Could not record the order. Please try again." },
      { status: 500 }
    );
  }

  // The order was placed — the customer's live cart is no longer "abandoned".
  try {
    await markCartConverted(session.phone);
  } catch {
    /* non-fatal */
  }

  // WhatsApp order confirmation (never fatal — the order is already recorded).
  const notify = await notifyOrderConfirmedSafe(local.orderId);

  // The order will be pushed to EasyEcom after the hold window by the worker.
  return NextResponse.json({
    success: true,
    message: "COD order recorded",
    orderNumber: local.orderNumber,
    total: local.total,
    localSaved: true,
    whatsappSent: notify.sent,
    ip,
  });
}
