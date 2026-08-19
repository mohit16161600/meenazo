import { NextResponse } from "next/server";
import { captureOrder, attachRazorpayOrder } from "@/lib/orderCapture";
import { createRazorpayOrder, isRazorpayConfigured, getKeyId } from "@/lib/razorpay";
import { buildGatewayNotes } from "@/lib/paymentMeta";
import { clientIp } from "@/lib/clientIp";
import { getCustomerSession } from "@/lib/customerAuth";
import { getCustomerByPhone } from "@/lib/customerStore";
import { getSiteConfig } from "@/lib/panelSettings";
import { isOnlinePaymentEnabled, onlinePaymentDisabledMessage } from "@/lib/pricing";

/**
 * Razorpay order-create endpoint.
 * ---------------------------------------------------------------------------
 * SECURITY: the amount is computed ENTIRELY on the server. The browser only
 * sends which products (slug + variety + qty), the coupon code and the address
 * — never a price. We price the cart via captureOrder (catalog + coupon +
 * shipping from the panel DB / data files), record a PENDING order row, then
 * create a Razorpay order for exactly that total. The client opens Razorpay
 * checkout with the returned order id and pays; /api/razorpay/verify then
 * verifies the signature and flips the order to confirmed.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Item {
  product?: string;
  variant?: string;
  quantity?: number;
}
interface Body {
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  coupon?: string;
  items?: Item[];
}

export async function POST(req: Request) {
  // Login required — must be signed in to pay.
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Please log in to continue.", needsLogin: true },
      { status: 401 }
    );
  }
  // ...and the phone must be OTP-verified.
  if (!session.verified) {
    return NextResponse.json(
      { success: false, message: "Please verify your mobile number with an OTP to place an order.", needsOtp: true },
      { status: 403 }
    );
  }
  // The cookie alone is never enough — the account must still exist in the DB
  // and be OTP-verified THERE (see /api/cod). Fails closed on DB errors.
  let account: Awaited<ReturnType<typeof getCustomerByPhone>>;
  try {
    account = await getCustomerByPhone(session.phone);
  } catch (err) {
    console.error("[RZP] account check failed:", err);
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

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { success: false, message: "Online payment is not configured yet. Please use Cash on Delivery." },
      { status: 503 }
    );
  }

  // The owner's master switch (panel → Settings → Payment options). Checked
  // before anything is priced or written, so switching online payment off is
  // immediate even for a checkout tab that was already open.
  if (!isOnlinePaymentEnabled(await getSiteConfig())) {
    return NextResponse.json(
      { success: false, message: onlinePaymentDisabledMessage(), onlineBlocked: true },
      { status: 422 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  // Signed-in phone is authoritative (primary identity).
  const mobile = session.phone;
  const address = String(body.address ?? "").trim();
  const state = String(body.state ?? "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  const errors: string[] = [];
  if (name === "") errors.push("name is required");
  if (mobile.length < 10) errors.push("valid mobile is required");
  if (address === "") errors.push("address is required");
  if (state === "") errors.push("state is required");
  if (items.length === 0) errors.push("at least one product is required");
  if (errors.length) {
    return NextResponse.json({ success: false, message: errors.join(", ") }, { status: 422 });
  }

  const ip = clientIp(req);

  // 1) Server-side priced PENDING order row (source of truth for the amount).
  let rec: Awaited<ReturnType<typeof captureOrder>>;
  try {
    rec = await captureOrder({
      name,
      mobile,
      // Typed delivery contact (account identity stays `mobile`).
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
      paymentMethod: "razorpay",
      status: "pending",
      ip,
      source: "website",
    });
  } catch (err) {
    const e = err as { code?: string; message?: string; skipped?: string[] };
    if (e.code === "NO_ITEMS") {
      return NextResponse.json(
        { success: false, message: "No valid products to order", skipped: e.skipped ?? [] },
        { status: 422 }
      );
    }
    // Switched off between this request's own check and the capture.
    if (e.code === "ONLINE_DISABLED") {
      return NextResponse.json(
        { success: false, message: onlinePaymentDisabledMessage(), onlineBlocked: true },
        { status: 422 }
      );
    }
    console.error("[RZP] order capture failed:", err);
    return NextResponse.json(
      { success: false, message: "Could not start the order. Please try again." },
      { status: 500 }
    );
  }

  // 2) Create the Razorpay order for exactly the server-computed total, tagged
  //    with the full order story (see lib/paymentMeta) so a payment can always
  //    be matched to an order — and to a customer — from the Razorpay dashboard.
  try {
    const amountPaise = rec.total * 100;
    let rzp: Awaited<ReturnType<typeof createRazorpayOrder>>;
    try {
      rzp = await createRazorpayOrder(
        amountPaise,
        rec.orderNumber,
        buildGatewayNotes({
          orderId: rec.orderId,
          orderNumber: rec.orderNumber,
          customerName: name,
          accountPhone: mobile,
          deliveryPhone: String(body.mobile ?? "").trim(),
          email: String(body.email ?? "").trim(),
          address,
          city: String(body.city ?? "").trim(),
          state,
          pincode: String(body.pincode ?? "").trim(),
          items: rec.items,
          couponCode: rec.couponCode,
          prepaidDiscount: rec.prepaidDiscount,
          total: rec.total,
          source: "website",
        })
      );
    } catch (err) {
      // The detail is a convenience for support; BEING ABLE TO PAY is not. If
      // the gateway refuses the order for any reason at all, try once more with
      // the bare minimum — `orderId` is what the webhook needs to find this
      // order again — rather than turning it into a dead checkout.
      console.error("[RZP] create order failed, retrying with minimal notes:", err);
      rzp = await createRazorpayOrder(amountPaise, rec.orderNumber, {
        orderId: rec.orderId,
        orderNumber: rec.orderNumber,
      });
    }
    await attachRazorpayOrder(rec.orderId, rzp.id);

    return NextResponse.json({
      success: true,
      keyId: getKeyId(),
      razorpayOrderId: rzp.id,
      amount: rzp.amount, // paise
      currency: rzp.currency,
      orderNumber: rec.orderNumber,
      internalOrderId: rec.orderId,
      total: rec.total, // rupees, for display
      prefill: { name, email: String(body.email ?? "").trim(), contact: mobile },
    });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[RZP] create order failed:", err);
    return NextResponse.json(
      { success: false, message: e.message ?? "Payment gateway error. Please try again." },
      { status: 502 }
    );
  }
}
