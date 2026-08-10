import { imgSrc } from "@/utils/image";
import type { RowDataPacket } from "mysql2";
import type { Coupon, Product, ProductVariant } from "@/types";
import { MODELS } from "./panelModels";
import { listRows, insertRow, updateRow } from "./panelCrud";
import { getSiteConfig } from "./panelSettings";
import { formatOrderNumber, ensureOrderInfra } from "./orderNumber";
import { logCustomerActivity } from "./customerActivity";
import { getHoldHours } from "./easyecom";
import { prepaidDiscountFor, isPrepaidMethod, couponAllowedForMethod } from "./pricing";
import { codMaxOrderValue, isCodAmountAllowed } from "./codRules";
import { products as fallbackProducts } from "@/data/products";
import { coupons as fallbackCoupons } from "@/data/coupons";

/**
 * Server-side order capture — the local "next level" enquiry store.
 * ---------------------------------------------------------------------------
 * Everything the customer ordered is priced ON THE SERVER (catalog + coupon +
 * shipping rules come from the panel DB, falling back to the static data files
 * when the DB is unreachable) and saved as ONE complete row in the local
 * `orders` table: every product, its variety (variant/pack), quantity, unit
 * price, line total, the offer applied, totals, address and meta.
 *
 * This closes the old known hole where COD pricing was client-trusted, and —
 * unlike the CRM `enquiry` table — nothing (quantity, offer, totals) is lost.
 */

export interface CaptureItemInput {
  product: string; // product slug
  variant?: string; // variety / pack label (must match a product variant)
  quantity?: number;
}

export interface CaptureOrderInput {
  name: string;
  /** Account identity — the OTP-verified login number. Never client-supplied. */
  mobile: string;
  /** Delivery contact typed on the checkout form (may differ from `mobile`). */
  shippingPhone?: string;
  address: string;
  city?: string;
  state: string;
  pincode?: string;
  email?: string;
  items: CaptureItemInput[];
  coupon?: string;
  paymentMethod?: string; // cod | razorpay | upi
  /** Initial order status. Defaults to "pending" (COD, or a not-yet-paid online order). */
  status?: string;
  ip?: string;
  source?: string;
}

/** Small structured blob stored in the order's `notes` column. */
export interface OrderNotes {
  razorpay?: {
    orderId?: string;
    paymentId?: string;
    paidAt?: string;
    /** How the customer actually paid: upi | card | netbanking | wallet | emi | paylater. */
    method?: string;
    /** Last declined attempt (kept so support can explain a failed payment). */
    lastError?: { at: string; code?: string; description?: string; paymentId?: string; method?: string };
    /** Refunds reported by the webhook. */
    refunds?: { at: string; refundId?: string; paymentId?: string; amount?: number; status?: string }[];
  };
}

export interface PricedItem {
  productId: string;
  name: string;
  slug: string;
  sku?: string; // EasyEcom SKU (variant SKU wins, else product SKU)
  /** Present only when the chosen variety carried its OWN SKU — lets the
   *  EasyEcom push tell a real pack SKU apart from a base-SKU fallback. */
  variantSku?: string;
  emoji: string;
  image?: string;
  variant?: string;
  unit?: string;
  quantity: number;
  price: number; // effective unit price actually charged
  mrp: number; // list price for reference
  lineTotal: number;
}

export interface CaptureResult {
  orderId: string;
  orderNumber: string;
  items: PricedItem[];
  subtotal: number;
  /** Coupon discount only — the prepaid offer is tracked separately. */
  discount: number;
  /** Instant "pay online" discount (0 for COD). */
  prepaidDiscount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  skipped: string[]; // unknown product slugs
}

/* --------------------------- catalog resolution --------------------------- */

async function loadCatalog(): Promise<Product[]> {
  try {
    const { items } = await listRows(MODELS.products);
    if (items.length) return items as unknown as Product[];
  } catch {
    /* DB unreachable → fallback */
  }
  return fallbackProducts;
}

async function loadCoupons(): Promise<Coupon[]> {
  try {
    const { items } = await listRows(MODELS.coupons);
    if (items.length) return items as unknown as Coupon[];
  } catch {
    /* DB unreachable → fallback */
  }
  return fallbackCoupons;
}

function effective(price: number, salePrice?: number | null): number {
  return salePrice != null && salePrice > 0 && salePrice < price ? salePrice : price;
}

/**
 * Loose label key: lowercase alphanumerics only. Tolerates whitespace,
 * punctuation and encoding differences (e.g. a mangled "·") so a cosmetic
 * label mismatch can't silently price a bigger pack at the base price.
 */
const labelKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Resolve unit price + display fields for one requested item.
 * Returns null when the requested variety doesn't exist on the product — the
 * caller then skips the line instead of charging the base price for a pack the
 * customer never actually selected.
 */
function priceItem(product: Product, req: CaptureItemInput): PricedItem | null {
  const qty = Math.max(1, Math.min(99, Math.floor(Number(req.quantity ?? 1)) || 1));

  // Match the requested variety against the product's variants (by label);
  // exact match first, then the normalized fallback.
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  let variant: ProductVariant | undefined;
  if (req.variant && hasVariants) {
    const want = req.variant.trim().toLowerCase();
    variant = product.variants!.find((v) => v.label?.trim().toLowerCase() === want);
    if (!variant) {
      const wantKey = labelKey(req.variant);
      if (wantKey) variant = product.variants!.find((v) => labelKey(v.label ?? "") === wantKey);
    }
    // A variety was asked for but no such pack exists: refuse the line rather
    // than silently charging the 1-pack price while recording the big-pack label.
    if (!variant) return null;
  }

  const mrp = variant ? variant.price : product.price;
  const price = variant
    ? effective(variant.price, variant.salePrice)
    : effective(product.price, product.salePrice);

  // EasyEcom SKU: the chosen pack's SKU wins, else the product's base SKU.
  const sku = (variant?.sku ?? product.sku ?? "") ? String(variant?.sku ?? product.sku) : undefined;
  const variantSku = String(variant?.sku ?? "").trim() || undefined;

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    sku,
    variantSku,
    emoji: product.emoji,
    image: imgSrc(product.images?.[0]),
    // Only ever the catalog's own label — never an unvalidated client string.
    variant: variant?.label,
    unit: variant?.unit ?? product.unit,
    quantity: qty,
    price,
    mrp,
    lineTotal: price * qty,
  };
}

/**
 * Keep a client-supplied delivery number only if it's a plausible 10-digit
 * Indian mobile; anything else falls back to the account number so the courier
 * never gets junk.
 */
function normalizeDeliveryPhone(raw: string | undefined): string | undefined {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : undefined;
}

/* ------------------------------ coupon rules ------------------------------ */

function applyCoupon(
  coupon: Coupon | undefined,
  subtotal: number,
  paymentMethod?: string | null
): { discount: number; freeShipping: boolean; code: string | null } {
  if (!coupon || !coupon.active) return { discount: 0, freeShipping: false, code: null };
  // Payment-method scoping (prepaid-only / COD-only / both) — same rule as the
  // checkout preview (lib/pricing.ts), enforced HERE so a doctored request can
  // never take a prepaid-only discount on a COD order (or vice versa).
  if (!couponAllowedForMethod(coupon, paymentMethod ?? "cod"))
    return { discount: 0, freeShipping: false, code: null };
  if (coupon.minOrder && subtotal < coupon.minOrder)
    return { discount: 0, freeShipping: false, code: null };

  // value 0 → shipping-only coupon (mirrors useCartSummary's FREESHIP rule)
  if (coupon.value === 0) return { discount: 0, freeShipping: true, code: coupon.code };

  let discount =
    coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { discount, freeShipping: false, code: coupon.code };
}

/* ------------------------------- main entry ------------------------------- */

export async function captureOrder(input: CaptureOrderInput): Promise<CaptureResult> {
  // Self-migrating schema (serial ids, EasyEcom/WhatsApp columns, the coupon
  // `applies_to` scope). Cached, so this is a no-op after the first order —
  // but it MUST stay on this path: it is what lets a schema addition land on a
  // live install without the owner re-running setup.
  await ensureOrderInfra();

  const catalog = await loadCatalog();

  // Backfill pack varieties from the static catalog for any product the panel
  // DB doesn't carry them for yet, so variant orders are priced correctly even
  // before the owner (re-)enters varieties in the panel + publishes. Varieties
  // defined in the DB always win — this only fills a genuinely empty list.
  const staticBySlug = new Map(fallbackProducts.map((p) => [p.slug.toLowerCase(), p]));
  for (const p of catalog) {
    const s = staticBySlug.get(String(p.slug ?? "").toLowerCase());
    if (!Array.isArray(p.variants) || p.variants.length === 0) {
      if (s?.variants?.length) p.variants = s.variants;
    }
    // Backfill the EasyEcom SKU from the static catalog for any DB product that
    // predates the `sku` column, so orders always carry a SKU without the owner
    // having to re-enter it in the panel (DB value always wins when present).
    if (!p.sku && s?.sku) p.sku = s.sku;
  }

  const bySlug = new Map(catalog.map((p) => [p.slug.toLowerCase(), p]));

  const items: PricedItem[] = [];
  const skipped: string[] = [];
  for (const req of input.items) {
    const product = bySlug.get(String(req.product ?? "").trim().toLowerCase());
    if (!product) {
      skipped.push(String(req.product ?? ""));
      continue;
    }
    const priced = priceItem(product, req);
    if (!priced) {
      // Unknown variety for a known product.
      skipped.push(`${product.slug} (${req.variant})`);
      continue;
    }
    items.push(priced);
  }
  if (items.length === 0) {
    throw Object.assign(new Error("No valid products to record"), { code: "NO_ITEMS", skipped });
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  // Coupon (server-validated)
  let couponDef: Coupon | undefined;
  if (input.coupon) {
    const all = await loadCoupons();
    const want = input.coupon.trim().toUpperCase();
    couponDef = all.find((c) => c.code.toUpperCase() === want && c.active);
  }
  const { discount, freeShipping, code } = applyCoupon(
    couponDef,
    subtotal,
    input.paymentMethod ?? "cod"
  );

  // Shipping + the prepaid offer from site settings (panel-editable, falls back
  // to data/site.ts).
  const site = await getSiteConfig();

  // Paying online earns an instant discount — computed HERE, on the server, from
  // the panel's percent. The browser only says which method was chosen; it can
  // never dictate the amount, and the Razorpay order is created for this total.
  const netSubtotal = Math.max(0, subtotal - discount);
  const prepaidDiscount = prepaidDiscountFor(netSubtotal, site, input.paymentMethod);

  const shipping =
    freeShipping || netSubtotal - prepaidDiscount >= site.freeShippingThreshold
      ? 0
      : site.shippingCharge;

  const total = netSubtotal - prepaidDiscount + shipping;

  // COD value cap. Checked HERE — after the server has priced the order and
  // before anything is written — so every COD capture path is covered and a
  // doctored cart can never slip a high-value order past the rule.
  if (!isPrepaidMethod(input.paymentMethod) && !isCodAmountAllowed(total, site)) {
    throw Object.assign(new Error("COD is not available for this order value"), {
      code: "COD_LIMIT",
      limit: codMaxOrderValue(site),
      total,
    });
  }

  // The order is pushed to EasyEcom only after the hold window (default 3h).
  const dispatchAt = new Date(Date.now() + getHoldHours() * 60 * 60 * 1000).toISOString();

  // The row's own serial id (S.No — assigned by MySQL, newest always last) is
  // the order sequence: MPL#### is just that serial formatted.
  const created = await insertRow(MODELS.orders, {
    customerName: input.name,
    customerMobile: input.mobile,
    shippingPhone: normalizeDeliveryPhone(input.shippingPhone) ?? input.mobile,
    customerEmail: input.email ?? null,
    address: input.address,
    city: input.city ?? null,
    state: input.state,
    pincode: input.pincode ?? null,
    items,
    subtotal,
    discount,
    prepaidDiscount,
    shipping,
    total,
    couponCode: code,
    paymentMethod: input.paymentMethod ?? "cod",
    // Nothing is collected at capture time — an online order only becomes
    // "prepaid" once the payment is verified (see confirmOrderPaidOnce).
    amountPaid: 0,
    status: input.status ?? "pending",
    notes: null,
    ip: input.ip ?? null,
    source: input.source ?? "website",
    crmSynced: false,
    easyecomSynced: false,
    easyecomRef: null,
    dispatchAt,
    easyecomPushedAt: null,
    easyecomAttempts: 0,
    easyecomError: null,
    easyecomLog: [],
  });

  const serial = Number(created.id);
  const orderId = String(serial);
  const orderNumber = formatOrderNumber(serial);
  try {
    await updateRow(MODELS.orders, orderId, { orderNumber });
  } catch (err) {
    // Never leave an order without its MPL number (EasyEcom/WhatsApp need it) —
    // undo the row so the customer sees a clean failure and can retry.
    const { getPanelPool } = await import("./panelDb");
    await getPanelPool()
      .query("DELETE FROM `orders` WHERE id = ?", [serial])
      .catch(() => {});
    throw err;
  }

  // Activity trail: one row per placed order, keyed by the account number.
  await logCustomerActivity(input.mobile, "order_placed", {
    orderNumber,
    total,
    paymentMethod: input.paymentMethod ?? "cod",
    items: items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} ×${i.quantity}`),
  }, input.ip ?? null);

  return {
    orderId,
    orderNumber,
    items,
    subtotal,
    discount,
    prepaidDiscount,
    shipping,
    total,
    couponCode: code,
    skipped,
  };
}

/** Mark an order as mirrored into the live CRM enquiry table. */
export async function markCrmSynced(orderId: string): Promise<void> {
  const { updateRow } = await import("./panelCrud");
  await updateRow(MODELS.orders, orderId, { crmSynced: true });
}

/* ---------------------------- Razorpay linkage ---------------------------- */

function parseNotes(raw: unknown): OrderNotes {
  try {
    return raw ? (JSON.parse(String(raw)) as OrderNotes) : {};
  } catch {
    return {};
  }
}

/** Record the Razorpay order id on our order row (set right after RZP order create). */
export async function attachRazorpayOrder(orderId: string, razorpayOrderId: string): Promise<void> {
  const { getRow, updateRow } = await import("./panelCrud");
  const row = await getRow(MODELS.orders, orderId);
  const notes = parseNotes(row?.notes);
  notes.razorpay = { ...(notes.razorpay ?? {}), orderId: razorpayOrderId };
  await updateRow(MODELS.orders, orderId, { notes: JSON.stringify(notes) });
}

/**
 * Atomically flip an order pending -> confirmed exactly once.
 * The conditional `WHERE status <> 'confirmed'` + InnoDB row lock means only the
 * FIRST of any concurrent /verify calls gets affectedRows === 1; the rest no-op.
 * Callers gate one-time side effects (CRM mirror) on the returned boolean so a
 * replayed/parallel verify can't double-fire them.
 */
export async function confirmOrderPaidOnce(
  orderId: string,
  razorpayPaymentId: string,
  existingNotes: OrderNotes = {},
  extra: { method?: string } = {}
): Promise<boolean> {
  const { getPanelPool } = await import("./panelDb");
  const pool = getPanelPool();
  const notes: OrderNotes = {
    ...existingNotes,
    razorpay: {
      ...(existingNotes.razorpay ?? {}),
      paymentId: razorpayPaymentId,
      paidAt: new Date().toISOString(),
      ...(extra.method ? { method: extra.method } : {}),
    },
  };
  // Record the money as collected too: `amount_paid = total` is what makes the
  // order read as "Prepaid" (vs COD/partial) across the dashboard and filters.
  const [res] = await pool.query(
    "UPDATE `orders` SET status = 'confirmed', amount_paid = total, notes = ?, updated_at = ? WHERE id = ? AND status <> 'confirmed'",
    [JSON.stringify(notes), new Date().toISOString(), orderId]
  );
  return ((res as { affectedRows?: number }).affectedRows ?? 0) === 1;
}

/**
 * Find OUR order id from a Razorpay order id.
 * The webhook is the only path where we don't already know the internal id: the
 * customer's browser never touched us (they closed the tab after paying), so we
 * look the order up by the `rzp_order_…` id stored in its notes.
 */
export async function findOrderIdByRazorpayOrderId(razorpayOrderId: string): Promise<string | null> {
  if (!razorpayOrderId) return null;
  const { getPanelPool } = await import("./panelDb");
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, notes FROM `orders` WHERE notes LIKE ? ORDER BY created_at DESC LIMIT 5",
    [`%${razorpayOrderId}%`]
  );
  // LIKE can only narrow the candidates — confirm the id really is the stored
  // Razorpay order id and not some other text that happens to contain it.
  for (const row of rows) {
    if (parseNotes(row.notes).razorpay?.orderId === razorpayOrderId) return String(row.id);
  }
  return null;
}

/** Merge a patch into an order's `notes` JSON (raw SQL — no model round-trip). */
async function patchNotes(orderId: string, mutate: (notes: OrderNotes) => OrderNotes): Promise<void> {
  const { getPanelPool } = await import("./panelDb");
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT notes FROM `orders` WHERE id = ? LIMIT 1",
    [orderId]
  );
  if (!rows.length) return;
  const next = mutate(parseNotes(rows[0].notes));
  await pool.query("UPDATE `orders` SET notes = ?, updated_at = ? WHERE id = ?", [
    JSON.stringify(next),
    new Date().toISOString(),
    orderId,
  ]);
}

/**
 * Record a declined payment on the order. The order deliberately STAYS pending
 * (and unpaid) — the customer can retry — but support can now see exactly why
 * the attempt failed.
 */
export async function recordPaymentFailure(
  orderId: string,
  info: { paymentId?: string; code?: string; description?: string; method?: string }
): Promise<void> {
  await patchNotes(orderId, (notes) => ({
    ...notes,
    razorpay: {
      ...(notes.razorpay ?? {}),
      lastError: { at: new Date().toISOString(), ...info },
    },
  }));
}

/** Record a refund reported by the webhook (audit trail; money moves at Razorpay). */
export async function recordRefund(
  orderId: string,
  info: { refundId?: string; paymentId?: string; amount?: number; status?: string }
): Promise<void> {
  await patchNotes(orderId, (notes) => ({
    ...notes,
    razorpay: {
      ...(notes.razorpay ?? {}),
      refunds: [...(notes.razorpay?.refunds ?? []), { at: new Date().toISOString(), ...info }].slice(-10),
    },
  }));
}

export interface CapturedOrderSummary {
  status?: string;
  total?: number;
  orderNumber?: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
}

/** Read back a captured order (for server-side verification of an online payment). */
export async function getCapturedOrder(orderId: string): Promise<CapturedOrderSummary | null> {
  const { getRow } = await import("./panelCrud");
  const row = await getRow(MODELS.orders, orderId);
  if (!row) return null;
  const notes = parseNotes(row.notes);
  return {
    status: row.status as string | undefined,
    total: row.total as number | undefined,
    orderNumber: row.orderNumber as string | undefined,
    paymentMethod: row.paymentMethod as string | undefined,
    razorpayOrderId: notes.razorpay?.orderId,
  };
}
