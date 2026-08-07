import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { captureOrder } from "@/lib/orderCapture";
import { clientIp } from "@/lib/clientIp";
import { getCustomerSession } from "@/lib/customerAuth";
import { markCartConverted, getCustomerByPhone } from "@/lib/customerStore";
import { notifyOrderConfirmedSafe } from "@/lib/orderNotify";
import { getSiteConfig } from "@/lib/panelSettings";
import {
  codAmountBlockedMessage,
  codCooldownBlockedMessage,
  codCooldownMinutes,
  codMaxOrderValue,
  codWaitMinutes,
} from "@/lib/codRules";

/**
 * COD order endpoint — next-level order capture.
 * ---------------------------------------------------------------------------
 * The full order (every product with its SKU, variety, quantity, unit price,
 * line total, offer/coupon, totals, address, ip, source) is saved as ONE row
 * in the LOCAL panel database `orders` table — server-side priced — and given
 * a sequential fulfillment number (mpl0001, mpl0002, …).
 *
 * Two COD rules are enforced here and nowhere else on the request path (see
 * lib/codRules.ts):
 *   • value cap — high-value orders must be prepaid (checked inside
 *     captureOrder, on the server-computed total)
 *   • cooldown  — one COD order per number per hour
 * The checkout mirrors both so the customer sees them before filling the form,
 * but the browser's word is never taken for either.
 *
 * Orders are NO LONGER mirrored into the CRM `enquiry` table. Instead they are
 * pushed to EasyEcom for fulfillment after a hold window (default 3h) by the
 * dispatch worker (lib/easyecomDispatch.ts) — see instrumentation.ts and
 * /api/easyecom/dispatch.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * When this number last placed a COD order — the anchor for the cooldown.
 * Cancelled orders don't count (nothing was ever sent out), and `created_at`
 * holds an ISO-8601 UTC string, so a DESC sort is chronological.
 */
async function lastCodOrderAt(phone: string): Promise<string | null> {
  const { getPanelPool } = await import("@/lib/panelDb");
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    // `status IS NULL OR …` — a NULL status must still count as a live order;
    // plain `status <> 'cancelled'` evaluates to NULL and would drop the row.
    "SELECT created_at FROM `orders` WHERE customer_mobile = ? AND payment_method = 'cod' " +
      "AND (status IS NULL OR status <> 'cancelled') ORDER BY created_at DESC LIMIT 1",
    [phone]
  );
  return rows.length ? ((rows[0].created_at as string | null) ?? null) : null;
}

/**
 * Minutes this number must still wait before another COD order.
 * A failed lookup fails OPEN — this is an anti-abuse rule, not an auth check,
 * and a DB hiccup must not stop a genuine customer from ordering (the capture
 * that follows hits the same DB and would fail loudly anyway).
 */
async function codCooldownWait(phone: string, config: Awaited<ReturnType<typeof getSiteConfig>>) {
  try {
    return codWaitMinutes(await lastCodOrderAt(phone), config);
  } catch (err) {
    console.error("[COD] cooldown lookup failed:", err);
    return 0;
  }
}

/**
 * COD eligibility for the signed-in customer — lets the checkout grey the COD
 * card out (with the reason and the wait) before anything is typed.
 */
export async function GET() {
  const site = await getSiteConfig();
  const maxOrderValue = codMaxOrderValue(site);
  const cooldownMinutes = codCooldownMinutes(site);
  const session = await getCustomerSession();

  const retryAfterMinutes = session ? await codCooldownWait(session.phone, site) : 0;

  return NextResponse.json({
    success: true,
    allowed: retryAfterMinutes === 0,
    reason: retryAfterMinutes > 0 ? codCooldownBlockedMessage(retryAfterMinutes) : null,
    retryAfterMinutes,
    maxOrderValue,
    cooldownMinutes,
  });
}

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

  // ---- COD cooldown: one COD order per number per cooldown window ----
  // Checked before pricing so a blocked customer never gets an order row.
  const site = await getSiteConfig();
  const waitMinutes = await codCooldownWait(session.phone, site);
  if (waitMinutes > 0) {
    return NextResponse.json(
      {
        success: false,
        message: codCooldownBlockedMessage(waitMinutes),
        codBlocked: "cooldown",
        retryAfterMinutes: waitMinutes,
      },
      { status: 429 }
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
    const e = err as { code?: string; message?: string; skipped?: string[]; limit?: number };
    if (e.code === "NO_ITEMS") {
      return NextResponse.json(
        { success: false, message: "No valid products to record", skipped: e.skipped ?? [] },
        { status: 422 }
      );
    }
    // Over the COD value cap — the order is prepaid-only and nothing was saved.
    if (e.code === "COD_LIMIT") {
      const limit = Number(e.limit ?? codMaxOrderValue(site));
      return NextResponse.json(
        {
          success: false,
          message: codAmountBlockedMessage(limit),
          codBlocked: "amount",
          maxOrderValue: limit,
        },
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
