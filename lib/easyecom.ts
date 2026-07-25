/**
 * EasyEcom order push — sends a captured order to EasyEcom for fulfillment.
 * ---------------------------------------------------------------------------
 * Orders are NO LONGER mirrored as CRM enquiry leads. Instead the full order is
 * pushed to EasyEcom as a `retailorder`, keyed by each product's SKU, a fixed
 * time (the hold window, default 3h) after it is placed — see easyecomDispatch.
 *
 * All account-specific values (endpoint, token, marketplace/payment/shipping
 * ids) come from env, mirroring how Razorpay / SMS creds are configured. Leave
 * EASYECOM_API_URL or EASYECOM_API_TOKEN blank to disable pushing (orders still
 * capture locally and simply stay queued until the keys are filled).
 *
 * Env:
 *   EASYECOM_API_URL, EASYECOM_API_TOKEN
 *   EASYECOM_MARKETPLACE_ID (default 10)
 *   EASYECOM_PAYMENT_MODE_COD (default 2), EASYECOM_PAYMENT_MODE_PREPAID (default 1)
 *   EASYECOM_SHIPPING_METHOD (default 1), EASYECOM_CARRIER_ID (optional)
 *   EASYECOM_IS_MARKET_SHIPPED (default 0), EASYECOM_HOLD_HOURS (default 3)
 */

const num = (v: string | undefined, dflt: number): number => {
  const n = Number((v ?? "").trim());
  return Number.isFinite(n) && (v ?? "").trim() !== "" ? n : dflt;
};

export function isEasyEcomConfigured(): boolean {
  return Boolean((process.env.EASYECOM_API_URL ?? "").trim() && (process.env.EASYECOM_API_TOKEN ?? "").trim());
}

/** Hold window (hours) before a placed order is pushed to EasyEcom. */
export function getHoldHours(): number {
  return Math.max(0, num(process.env.EASYECOM_HOLD_HOURS, 3));
}

export interface EasyEcomOrderItem {
  sku?: string | null;
  slug?: string;
  name?: string;
  variant?: string | null;
  quantity?: number;
  price?: number;
}

/** The order shape we consume — the API/DB row (camelCase) from the orders table. */
export interface EasyEcomOrderInput {
  orderNumber?: string;
  createdAt?: string | null;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string | null;
  address?: string;
  city?: string | null;
  state?: string;
  pincode?: string | null;
  paymentMethod?: string;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
  source?: string | null;
  items?: EasyEcomOrderItem[];
}

export interface EasyEcomPushResult {
  ok: boolean;
  ref?: string; // EasyEcom reference on success
  error?: string;
  skipped?: boolean; // not configured
}

/** Format an ISO/date string as EasyEcom's "YYYY-MM-DD HH:mm:ss". */
function fmtDate(value: string | null | undefined): string {
  const d = value ? new Date(value) : new Date();
  const date = Number.isNaN(d.getTime()) ? new Date() : d;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
}

/**
 * SKU for a line item — variant SKU wins, else product SKU. STRICTLY SKU-based:
 * there is no slug/id fallback, so an order never goes to EasyEcom keyed by
 * anything but a real SKU. A missing SKU returns "" and the push is blocked
 * (the order stays queued with a "Missing SKU" note) until the owner sets it.
 */
export function skuForItem(it: EasyEcomOrderItem): string {
  return String(it.sku ?? "").trim();
}

/** Build the EasyEcom createOrder payload from a captured order. */
export function buildEasyEcomPayload(order: EasyEcomOrderInput): Record<string, unknown> {
  const isCod = String(order.paymentMethod ?? "cod").toLowerCase() === "cod";
  const paymentMode = isCod
    ? num(process.env.EASYECOM_PAYMENT_MODE_COD, 2)
    : num(process.env.EASYECOM_PAYMENT_MODE_PREPAID, 1);
  const carrierId = num(process.env.EASYECOM_CARRIER_ID, 0);

  const orderNumber = String(order.orderNumber ?? "");
  const items = Array.isArray(order.items) ? order.items : [];

  const address = {
    name: order.customerName ?? "",
    addressLine1: order.address ?? "",
    addressLine2: "",
    postalCode: order.pincode ?? "",
    city: order.city ?? "",
    state: order.state ?? "",
    country: "India",
    contact: order.customerMobile ?? "",
    email: order.customerEmail ?? "",
  };

  const payload: Record<string, unknown> = {
    orderType: "retailorder",
    marketplaceId: num(process.env.EASYECOM_MARKETPLACE_ID, 10),
    orderNumber,
    orderDate: fmtDate(order.createdAt),
    remarks1: order.source ?? "meenazo website",
    shippingCost: Number(order.shipping ?? 0),
    discount: Number(order.discount ?? 0),
    paymentMode,
    shippingMethod: num(process.env.EASYECOM_SHIPPING_METHOD, 1),
    is_market_shipped: num(process.env.EASYECOM_IS_MARKET_SHIPPED, 0),
    items: items.map((it, i) => ({
      OrderItemId: `${orderNumber}-${i + 1}`,
      Sku: skuForItem(it),
      productName: it.variant ? `${it.name ?? ""} - ${it.variant}` : String(it.name ?? ""),
      Quantity: Number(it.quantity ?? 1),
      Price: Number(it.price ?? 0),
      itemDiscount: 0,
    })),
    customer: [
      {
        billing: address,
        shipping: address,
      },
    ],
  };

  if (carrierId > 0) payload.company_carrier_id = carrierId;
  return payload;
}

/** Push one order to EasyEcom. Never throws — returns a structured result. */
export async function pushOrderToEasyEcom(order: EasyEcomOrderInput): Promise<EasyEcomPushResult> {
  if (!isEasyEcomConfigured()) return { ok: false, skipped: true, error: "EasyEcom not configured" };

  // Guard: every line must resolve to a SKU, else EasyEcom rejects the order.
  const items = Array.isArray(order.items) ? order.items : [];
  const missing = items.filter((it) => !skuForItem(it));
  if (items.length === 0 || missing.length > 0) {
    return { ok: false, error: `Missing SKU for ${missing.length || "all"} item(s) — set product SKU in the panel.` };
  }

  const url = (process.env.EASYECOM_API_URL ?? "").trim();
  const token = (process.env.EASYECOM_API_TOKEN ?? "").trim();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildEasyEcomPayload(order)),
      cache: "no-store",
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      /* non-JSON response */
    }

    if (!res.ok) {
      const msg = String(data.message ?? data.error ?? text ?? `HTTP ${res.status}`).slice(0, 240);
      return { ok: false, error: `EasyEcom ${res.status}: ${msg}` };
    }

    // EasyEcom returns the created order's reference under varying keys.
    const ref =
      (data.orderId as string) ??
      (data.reference_code as string) ??
      ((data.data as Record<string, unknown>)?.orderId as string) ??
      "ok";
    return { ok: true, ref: String(ref) };
  } catch (err) {
    return { ok: false, error: String((err as Error)?.message ?? err).slice(0, 240) };
  }
}
