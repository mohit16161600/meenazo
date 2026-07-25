import { randomUUID } from "node:crypto";
import type { Coupon, Product, ProductVariant } from "@/types";
import { MODELS } from "./panelModels";
import { listRows, insertRow } from "./panelCrud";
import { getSiteConfig } from "./panelSettings";
import { nextOrderNumber } from "./orderNumber";
import { getHoldHours } from "./easyecom";
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
  mobile: string;
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
  razorpay?: { orderId?: string; paymentId?: string; paidAt?: string };
}

export interface PricedItem {
  productId: string;
  name: string;
  slug: string;
  sku?: string; // EasyEcom SKU (variant SKU wins, else product SKU)
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
  discount: number;
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

/** Resolve unit price + display fields for one requested item. */
function priceItem(product: Product, req: CaptureItemInput): PricedItem {
  const qty = Math.max(1, Math.min(99, Math.floor(Number(req.quantity ?? 1)) || 1));

  // Match the requested variety against the product's variants (by label);
  // exact match first, then the normalized fallback.
  let variant: ProductVariant | undefined;
  if (req.variant && Array.isArray(product.variants)) {
    const want = req.variant.trim().toLowerCase();
    variant = product.variants.find((v) => v.label?.trim().toLowerCase() === want);
    if (!variant) {
      const wantKey = labelKey(req.variant);
      if (wantKey) variant = product.variants.find((v) => labelKey(v.label ?? "") === wantKey);
    }
  }

  const mrp = variant ? variant.price : product.price;
  const price = variant
    ? effective(variant.price, variant.salePrice)
    : effective(product.price, product.salePrice);

  // EasyEcom SKU: the chosen pack's SKU wins, else the product's base SKU.
  const sku = (variant?.sku ?? product.sku ?? "") ? String(variant?.sku ?? product.sku) : undefined;

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    sku,
    emoji: product.emoji,
    image: product.images?.[0],
    variant: variant?.label ?? (req.variant || undefined),
    unit: variant?.unit ?? product.unit,
    quantity: qty,
    price,
    mrp,
    lineTotal: price * qty,
  };
}

/* ------------------------------ coupon rules ------------------------------ */

function applyCoupon(
  coupon: Coupon | undefined,
  subtotal: number
): { discount: number; freeShipping: boolean; code: string | null } {
  if (!coupon || !coupon.active) return { discount: 0, freeShipping: false, code: null };
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
    items.push(priceItem(product, req));
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
  const { discount, freeShipping, code } = applyCoupon(couponDef, subtotal);

  // Shipping from site settings (panel-editable, falls back to data/site.ts)
  const site = await getSiteConfig();
  const shipping =
    freeShipping || subtotal - discount >= site.freeShippingThreshold ? 0 : site.shippingCharge;

  const total = subtotal - discount + shipping;

  const orderId = "o-" + randomUUID().slice(0, 12);
  // Sequential fulfillment order number: mpl0001, mpl0002, … (sent to EasyEcom).
  const orderNumber = await nextOrderNumber(orderId);

  // The order is pushed to EasyEcom only after the hold window (default 3h).
  const dispatchAt = new Date(Date.now() + getHoldHours() * 60 * 60 * 1000).toISOString();

  await insertRow(MODELS.orders, {
    id: orderId,
    orderNumber,
    customerName: input.name,
    customerMobile: input.mobile,
    customerEmail: input.email ?? null,
    address: input.address,
    city: input.city ?? null,
    state: input.state,
    pincode: input.pincode ?? null,
    items,
    subtotal,
    discount,
    shipping,
    total,
    couponCode: code,
    paymentMethod: input.paymentMethod ?? "cod",
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

  return { orderId, orderNumber, items, subtotal, discount, shipping, total, couponCode: code, skipped };
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
  existingNotes: OrderNotes = {}
): Promise<boolean> {
  const { getPanelPool } = await import("./panelDb");
  const pool = getPanelPool();
  const notes: OrderNotes = {
    ...existingNotes,
    razorpay: {
      ...(existingNotes.razorpay ?? {}),
      paymentId: razorpayPaymentId,
      paidAt: new Date().toISOString(),
    },
  };
  const [res] = await pool.query(
    "UPDATE `orders` SET status = 'confirmed', notes = ?, updated_at = ? WHERE id = ? AND status <> 'confirmed'",
    [JSON.stringify(notes), new Date().toISOString(), orderId]
  );
  return ((res as { affectedRows?: number }).affectedRows ?? 0) === 1;
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
