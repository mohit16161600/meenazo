import { imgSrc } from "@/utils/image";
import type { RowDataPacket } from "mysql2";
import type { Coupon, Product, ProductVariant } from "@/types";
import { MODELS } from "./panelModels";
import { listRows, insertRow, updateRow } from "./panelCrud";
import { getSiteConfig } from "./panelSettings";
import { formatOrderNumber, ensureOrderInfra } from "./orderNumber";
import { logCustomerActivity } from "./customerActivity";
import { getHoldHours } from "./easyecom";
import {
  prepaidDiscountFor,
  prepaidPercent,
  isPrepaidMethod,
  isOnlinePaymentEnabled,
  couponAllowedForMethod,
  couponScope,
} from "./pricing";
import { codMaxOrderValue, isCodAmountAllowed, isCodEnabled } from "./codRules";
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

/**
 * One fully-priced state of an order — the money fields that only ever move
 * together. Two of these are stored on every pay-online order (see OrderNotes).
 */
export interface PricingSnapshot {
  /** Coupon discount. */
  discount: number;
  couponCode: string | null;
  /** Instant pay-online discount. */
  prepaidDiscount: number;
  shipping: number;
  total: number;
}

/** Small structured blob stored in the order's `notes` column. */
export interface OrderNotes {
  /**
   * The SAME order priced two ways, decided at capture time:
   *
   *   online — the pay-online discount (and any prepaid-only coupon) applied.
   *            This is the amount the gateway is asked to charge.
   *   unpaid — what the order is worth when that money never arrives and it
   *            goes out as Cash on Delivery instead.
   *
   * `mode` says which one the row currently holds. The discount is EARNED BY
   * PAYING, so an abandoned online checkout is flipped to `unpaid`
   * (revertPrepaidPricingIfUnpaid) and a late payment flips it back
   * (confirmOrderPaidOnce) — the customer never keeps a pay-online price on an
   * order the courier still has to collect for.
   */
  pricing?: {
    online: PricingSnapshot;
    unpaid: PricingSnapshot;
    mode: "online" | "unpaid";
    /** When the row last moved between the two. */
    changedAt?: string;
    /** Why it moved — shown to the owner in the panel. */
    reason?: string;
  };
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

/** Sellable only — a product switched off in the panel is off everywhere. */
const sellable = (list: Product[]) => list.filter((p) => p.active !== false);

async function loadCatalog(): Promise<Product[]> {
  try {
    const { items } = await listRows(MODELS.products);
    // Whether the DB is authoritative is decided on the RAW row count, and the
    // active filter applied after. Filtering first would mean "every product
    // deactivated" fell through to the static file and made them all orderable
    // again — the exact opposite of what switching them off means.
    if (items.length) return sellable(items as unknown as Product[]);
  } catch {
    /* DB unreachable → fallback */
  }
  return sellable(fallbackProducts);
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

/**
 * Everything pricing a cart produces, with none of it written down.
 *
 * `captureOrder` and the checkout's live quote (/api/pricing/quote) BOTH go
 * through this, so the number on the button is produced by the same code that
 * charges the card. The browser's own estimate is only a placeholder until this
 * answers — see hooks/useCart.
 */
export interface PricedCart {
  items: PricedItem[];
  skipped: string[];
  subtotal: number;
  /** As priced for the requested payment method. */
  priced: PricingSnapshot;
  /** The same cart as COD — the cap is judged on this, whatever is selected. */
  cod: PricingSnapshot;
  /** What paying online would save, for the COD nudge. */
  prepaidSaving: number;
  prepaidPercent: number;
  /** Set when the applied coupon is scoped to the OTHER payment method. */
  couponBlocked: "prepaid" | "cod" | null;
  codAmountAllowed: boolean;
  codMaxOrderValue: number;
  /** Master switches (panel → Settings → Payment options), live from the DB. */
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  freeShippingThreshold: number;
}

/**
 * Price a cart on the server. Throws NO_ITEMS when nothing in it is orderable;
 * the COD cap is REPORTED here (codAmountAllowed) rather than thrown, so the
 * checkout can explain it before the customer commits — captureOrder still
 * refuses it.
 */
export async function priceCart(input: {
  items: CaptureItemInput[];
  coupon?: string;
  paymentMethod?: string;
}): Promise<PricedCart> {
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
  // Shipping + the prepaid offer from site settings (panel-editable, falls back
  // to data/site.ts).
  const site = await getSiteConfig();

  /**
   * Price this cart for one payment method. An online order is priced TWICE —
   * once as chosen and once as COD — so what the order is worth without the
   * payment is recorded up front instead of being reconstructed later.
   */
  const priceFor = (method: string | undefined | null): PricingSnapshot => {
    const { discount, freeShipping, code } = applyCoupon(couponDef, subtotal, method ?? "cod");
    const net = Math.max(0, subtotal - discount);
    // Paying online earns an instant discount — computed HERE, on the server,
    // from the panel's percent. The browser only says which method was chosen;
    // it can never dictate the amount, and the gateway is asked for this total.
    const prepaid = prepaidDiscountFor(net, site, method);
    const ship =
      freeShipping || net - prepaid >= site.freeShippingThreshold ? 0 : site.shippingCharge;
    return {
      discount,
      couponCode: code,
      prepaidDiscount: prepaid,
      shipping: ship,
      total: net - prepaid + ship,
    };
  };

  const priced = priceFor(input.paymentMethod);
  // The COD variant is always computed: the cap is judged on it (so it doesn't
  // move when the customer toggles payment method) and it is what an unpaid
  // online order falls back to.
  const cod = priceFor("cod");

  return {
    items,
    skipped,
    subtotal,
    priced,
    cod,
    // The real saving is the gap between the two full totals — a coupon scoped
    // to one method makes that different from the prepaid discount alone, and
    // can even make paying online cost more. Clamped so the nudge just goes
    // away, and zero outright when online payment is switched off (a prepaid-
    // only coupon must not advertise a method nobody can pick).
    prepaidSaving: isOnlinePaymentEnabled(site)
      ? Math.max(0, cod.total - priceFor("razorpay").total)
      : 0,
    prepaidPercent: prepaidPercent(site),
    couponBlocked:
      couponDef && !couponAllowedForMethod(couponDef, input.paymentMethod ?? null)
        ? (couponScope(couponDef) as "prepaid" | "cod")
        : null,
    codAmountAllowed: isCodAmountAllowed(cod.total, site),
    codMaxOrderValue: codMaxOrderValue(site),
    codEnabled: isCodEnabled(site),
    onlinePaymentEnabled: isOnlinePaymentEnabled(site),
    freeShippingThreshold: site.freeShippingThreshold,
  };
}

export async function captureOrder(input: CaptureOrderInput): Promise<CaptureResult> {
  // Self-migrating schema (serial ids, EasyEcom/WhatsApp columns, the coupon
  // `applies_to` scope). Cached, so this is a no-op after the first order —
  // but it MUST stay on this path: it is what lets a schema addition land on a
  // live install without the owner re-running setup.
  await ensureOrderInfra();

  const quote = await priceCart(input);
  const { items, skipped, subtotal, priced, cod } = quote;
  const { discount, couponCode: code, prepaidDiscount, shipping, total } = priced;

  // What the same order is worth if the online payment never lands. Kept only
  // when it genuinely differs — i.e. the online price really was a concession.
  const capturedNotes: OrderNotes | null =
    isPrepaidMethod(input.paymentMethod) && cod.total !== priced.total
      ? { pricing: { online: priced, unpaid: cod, mode: "online" } }
      : null;

  // The owner's master switches. Checked HERE, alongside the value cap, so a
  // switched-off method is refused on EVERY capture path — a stale checkout
  // tab, a replayed request or a hand-rolled POST all hit this same line.
  if (isPrepaidMethod(input.paymentMethod)) {
    if (!quote.onlinePaymentEnabled) {
      throw Object.assign(new Error("Online payment is switched off"), {
        code: "ONLINE_DISABLED",
      });
    }
  } else if (!quote.codEnabled) {
    throw Object.assign(new Error("Cash on Delivery is switched off"), {
      code: "COD_DISABLED",
    });
  }

  // COD value cap. Checked HERE — after the server has priced the order and
  // before anything is written — so every COD capture path is covered and a
  // doctored cart can never slip a high-value order past the rule.
  if (!isPrepaidMethod(input.paymentMethod) && !quote.codAmountAllowed) {
    throw Object.assign(new Error("COD is not available for this order value"), {
      code: "COD_LIMIT",
      limit: quote.codMaxOrderValue,
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
    notes: capturedNotes ? JSON.stringify(capturedNotes) : null,
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

/** The order's notes as they are RIGHT NOW, or null when the row is gone. */
async function readNotes(orderId: string): Promise<OrderNotes | null> {
  const { getPanelPool } = await import("./panelDb");
  const [rows] = await getPanelPool().query<RowDataPacket[]>(
    "SELECT notes FROM `orders` WHERE id = ? LIMIT 1",
    [orderId]
  );
  return rows.length ? parseNotes(rows[0].notes) : null;
}

/**
 * Record the Razorpay order id on our order row (set right after RZP order
 * create). Raw SQL, like every other writer of this column: `notes` is
 * `immutable` in the model so the panel's CRUD layer can never overwrite the
 * payment record with typed text, and that guard would drop this write too.
 */
export async function attachRazorpayOrder(orderId: string, razorpayOrderId: string): Promise<void> {
  await patchNotes(orderId, (notes) => ({
    ...notes,
    razorpay: { ...(notes.razorpay ?? {}), orderId: razorpayOrderId },
  }));
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
  const stamp = new Date().toISOString();

  // Read the notes back instead of trusting the caller's copy: the pay-online
  // discount may have been stripped (revertPrepaidPricingIfUnpaid) between
  // their read and this write — and that is exactly what has to be undone now
  // that the money turned out to be real.
  const current = (await readNotes(orderId)) ?? existingNotes;
  const notes: OrderNotes = {
    ...current,
    razorpay: {
      ...(existingNotes.razorpay ?? {}),
      ...(current.razorpay ?? {}),
      paymentId: razorpayPaymentId,
      paidAt: stamp,
      ...(extra.method ? { method: extra.method } : {}),
    },
  };

  const reverted = current.pricing?.mode === "unpaid" ? current.pricing : null;
  if (reverted) {
    notes.pricing = {
      ...reverted,
      mode: "online",
      changedAt: stamp,
      reason: "payment received — pay-online pricing restored",
    };
  }

  // Record the money as collected too: `amount_paid = total` is what makes the
  // order read as "Prepaid" (vs COD/partial) across the dashboard and filters.
  // When the online price is being restored, both are set to that price — the
  // gateway charged the discounted amount, never the COD one.
  const sql = reverted
    ? "UPDATE `orders` SET status = 'confirmed', discount = ?, coupon_code = ?, prepaid_discount = ?, shipping = ?, total = ?, amount_paid = ?, notes = ?, updated_at = ? WHERE id = ? AND status <> 'confirmed'"
    : "UPDATE `orders` SET status = 'confirmed', amount_paid = total, notes = ?, updated_at = ? WHERE id = ? AND status <> 'confirmed'";
  const params = reverted
    ? [
        reverted.online.discount,
        reverted.online.couponCode,
        reverted.online.prepaidDiscount,
        reverted.online.shipping,
        reverted.online.total,
        reverted.online.total,
        JSON.stringify(notes),
        stamp,
        orderId,
      ]
    : [JSON.stringify(notes), stamp, orderId];

  const [res] = await pool.query(sql, params);
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

/**
 * Re-derive an order's line totals, subtotal and total from its items.
 *
 * The panel exposes item quantity, unit price, line total, subtotal, discount,
 * shipping and total as SEVEN independent inputs with nothing tying them
 * together. Bumping a phone order from 1 to 2 bottles left the total untouched,
 * and EasyEcom then shipped two while the courier collected for one. Called
 * after a panel save that touched the items, unless the owner typed a total of
 * their own in the same save — their number always wins.
 */
export async function recomputeOrderTotals(
  orderId: string
): Promise<{ changed: boolean; subtotal: number; total: number } | null> {
  const { getPanelPool } = await import("./panelDb");
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT items, subtotal, discount, prepaid_discount, shipping, total FROM `orders` WHERE id = ? LIMIT 1",
    [orderId]
  );
  const row = rows[0];
  if (!row) return null;

  let items: PricedItem[];
  try {
    const parsed = row.items ? JSON.parse(String(row.items)) : [];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    items = parsed as PricedItem[];
  } catch {
    return null; // unreadable line items — never guess at money
  }

  const fixed = items.map((i) => {
    const quantity = Math.max(0, Math.round(Number(i.quantity ?? 0)) || 0);
    const price = Math.max(0, Math.round(Number(i.price ?? 0)) || 0);
    return { ...i, quantity, price, lineTotal: price * quantity };
  });

  const subtotal = fixed.reduce((n, i) => n + i.lineTotal, 0);
  const discount = Math.max(0, Number(row.discount ?? 0));
  const prepaid = Math.max(0, Number(row.prepaid_discount ?? 0));
  const shipping = Math.max(0, Number(row.shipping ?? 0));
  const total = Math.max(0, subtotal - discount - prepaid) + shipping;

  if (subtotal === Number(row.subtotal ?? 0) && total === Number(row.total ?? 0)) {
    return { changed: false, subtotal, total };
  }

  await pool.query(
    "UPDATE `orders` SET items = ?, subtotal = ?, total = ?, updated_at = ? WHERE id = ?",
    [JSON.stringify(fixed), subtotal, total, new Date().toISOString(), orderId]
  );
  return { changed: true, subtotal, total };
}

/* ---------------- Unpaid online order → back to COD pricing --------------- */

export interface PrepaidReversal {
  /** The row was actually re-priced by this call. */
  changed: boolean;
  /** Rupees of pay-online discount taken back (0 when nothing changed). */
  removed: number;
  /** Total before / after — for the message the owner sees. */
  from?: number;
  to?: number;
}

/**
 * Rebuild the "never paid" price for an order captured BEFORE the two pricing
 * snapshots existed. Only these older rows need it; everything captured since
 * carries the exact figures the checkout used.
 */
async function rebuildUnpaidPricing(row: RowDataPacket): Promise<PricingSnapshot | null> {
  const subtotal = Math.max(0, Number(row.subtotal ?? 0));
  const prepaid = Math.max(0, Number(row.prepaid_discount ?? 0));
  const originalDiscount = Math.max(0, Number(row.discount ?? 0));

  let discount = originalDiscount;
  let couponCode = row.coupon_code ? String(row.coupon_code) : null;
  let freeShipping = false;

  // A prepaid-only coupon was not earned either, so it goes with the discount.
  // A shipping-only coupon (value 0) is method-neutral and survives.
  if (couponCode) {
    const wanted = couponCode.toUpperCase();
    const def = (await loadCoupons()).find((c) => c.code.toUpperCase() === wanted);
    if (def && !couponAllowedForMethod(def, "cod")) {
      discount = 0;
      couponCode = null;
    } else if (def && def.value === 0) {
      freeShipping = true;
    }
  }
  if (prepaid === 0 && discount === originalDiscount) return null; // nothing to take back

  const site = await getSiteConfig();
  const net = Math.max(0, subtotal - discount);
  const shipping = freeShipping || net >= site.freeShippingThreshold ? 0 : site.shippingCharge;
  return { discount, couponCode, prepaidDiscount: 0, shipping, total: net + shipping };
}

/**
 * Take the pay-online discount back off an order whose money never arrived.
 *
 * That discount is earned BY PAYING. An abandoned or failed checkout otherwise
 * leaves the order priced as though it had been paid, and whoever fulfils it —
 * the courier collecting COD, EasyEcom, the owner on the phone — collects the
 * discounted amount instead of the real one, with the shop eating the gap.
 *
 * Does nothing once any money is recorded against the order, is safe to call
 * repeatedly, and is undone automatically if the payment does land later
 * (see confirmOrderPaidOnce).
 */
export async function revertPrepaidPricingIfUnpaid(
  orderId: string,
  reason: string
): Promise<PrepaidReversal> {
  const none: PrepaidReversal = { changed: false, removed: 0 };
  const { getPanelPool } = await import("./panelDb");
  const pool = getPanelPool();

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, notes, subtotal, discount, coupon_code, prepaid_discount, shipping, total, amount_paid FROM `orders` WHERE id = ? LIMIT 1",
    [orderId]
  );
  const row = rows[0];
  if (!row) return none;
  // Any money at all against the order means they did pay online — leave it.
  if (Math.max(0, Number(row.amount_paid ?? 0)) > 0) return none;

  const notes = parseNotes(row.notes);
  if (notes.pricing && notes.pricing.mode !== "online") return none; // already reverted

  const online: PricingSnapshot = notes.pricing?.online ?? {
    discount: Number(row.discount ?? 0),
    couponCode: row.coupon_code ? String(row.coupon_code) : null,
    prepaidDiscount: Number(row.prepaid_discount ?? 0),
    shipping: Number(row.shipping ?? 0),
    total: Number(row.total ?? 0),
  };
  const unpaid = notes.pricing?.unpaid ?? (await rebuildUnpaidPricing(row));
  if (!unpaid || unpaid.total === Number(row.total ?? 0)) return none;

  const stamp = new Date().toISOString();
  const next: OrderNotes = {
    ...notes,
    pricing: { online, unpaid, mode: "unpaid", changedAt: stamp, reason },
  };

  // The amount_paid guard is repeated in the WHERE so a payment confirming at
  // this exact moment can't have the price pulled out from under it.
  const [res] = await pool.query(
    "UPDATE `orders` SET discount = ?, coupon_code = ?, prepaid_discount = ?, shipping = ?, total = ?, notes = ?, updated_at = ? WHERE id = ? AND COALESCE(amount_paid, 0) <= 0",
    [
      unpaid.discount,
      unpaid.couponCode,
      unpaid.prepaidDiscount,
      unpaid.shipping,
      unpaid.total,
      JSON.stringify(next),
      stamp,
      orderId,
    ]
  );
  if (((res as { affectedRows?: number }).affectedRows ?? 0) !== 1) return none;

  return {
    changed: true,
    removed: Math.max(0, unpaid.total - online.total),
    from: online.total,
    to: unpaid.total,
  };
}

/**
 * Strip the pay-online discount from every unpaid online order that has sat
 * past the grace window — the housekeeping pass behind the per-order calls, so
 * an abandoned checkout shows its true COD value in the panel on its own.
 *
 * The window exists because a UPI collect request can legitimately take a few
 * minutes; PREPAID_REVERT_MINUTES tunes it.
 */
export async function sweepStalePrepaidDiscounts(): Promise<number> {
  const graceMinutes = Math.max(5, Number(process.env.PREPAID_REVERT_MINUTES ?? 45) || 45);
  const { getPanelPool } = await import("./panelDb");
  const cutoff = new Date(Date.now() - graceMinutes * 60 * 1000).toISOString();

  // Candidates only — revertPrepaidPricingIfUnpaid makes the real decision.
  // The notes clause catches an order whose concession was a prepaid-ONLY
  // coupon rather than the percentage discount (prepaid_discount is 0 there,
  // but the price is still one the customer never paid for), and drops rows
  // that have already been reverted.
  const [rows] = await getPanelPool().query<RowDataPacket[]>(
    "SELECT id FROM `orders` WHERE COALESCE(amount_paid, 0) <= 0 AND status <> 'cancelled' AND created_at <= ? " +
      "AND (COALESCE(prepaid_discount, 0) > 0 OR notes LIKE '%\"mode\":\"online\"%') LIMIT 200",
    [cutoff]
  );

  let reverted = 0;
  for (const row of rows) {
    const res = await revertPrepaidPricingIfUnpaid(
      String(row.id),
      `online payment not completed within ${graceMinutes} minutes`
    );
    if (res.changed) reverted++;
  }
  return reverted;
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
