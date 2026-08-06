/**
 * Model registry for the admin panel.
 * ONE source of truth: these definitions generate both the SQL schema (DDL)
 * and the generic CRUD read/write mapping (camelCase API <-> snake_case DB,
 * JSON (de)serialisation, boolean coercion).
 */

export type FieldType =
  | "string"
  | "text"
  | "int"
  | "decimal"
  | "bool"
  | "json"
  | "datetime";

export interface Field {
  /** camelCase key used by the API/UI */
  key: string;
  /** snake_case DB column */
  col: string;
  type: FieldType;
  /** Precise column DDL (overrides the type default) */
  sqlType?: string;
  unique?: boolean;
  index?: boolean;
  nullable?: boolean;
  /** Never returned by the API (e.g. password hashes) */
  hidden?: boolean;
  /** Managed automatically (createdAt/updatedAt) — not writable from the client */
  auto?: "created" | "updated";
  /** System-managed audit field: readable via the API but silently ignored on
   *  client updates (only internal raw-SQL writers may change it). */
  immutable?: boolean;
}

export interface Model {
  name: string;
  table: string;
  /** camelCase pk key */
  pk: string;
  /** snake_case pk column */
  pkCol: string;
  /** pk is a human string (slug/code) supplied by the user, not auto-generated */
  pkFromUser?: boolean;
  fields: Field[];
  defaultSort?: string; // raw SQL, e.g. "created_at DESC"
  searchCols?: string[]; // snake_case cols used by ?q= search
}

const ts = (auto: "created" | "updated"): Field => ({
  key: auto === "created" ? "createdAt" : "updatedAt",
  col: auto === "created" ? "created_at" : "updated_at",
  type: "datetime",
  auto,
  nullable: true,
});

/* ------------------------------- Products ------------------------------- */
const products: Model = {
  name: "products",
  table: "products",
  pk: "id",
  pkCol: "id",
  pkFromUser: true,
  /**
   * Ordered by SKU, lowest first - that is how the owner reads the catalogue.
   * SKU is a VARCHAR, so plain string sorting would put "1099" before "110";
   * CAST forces a numeric comparison. Products with no SKU sort last (they are
   * the ones needing attention, not the ones to lead with), and a non-numeric
   * SKU casts to 0 and falls back to alphabetical.
   */
  defaultSort:
    "CASE WHEN sku IS NULL OR sku = '' THEN 1 ELSE 0 END ASC, CAST(sku AS UNSIGNED) ASC, sku ASC, name ASC",
  searchCols: ["name", "slug", "category", "brand"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "name", col: "name", type: "string" },
    { key: "slug", col: "slug", type: "string", unique: true },
    { key: "category", col: "category", type: "string", index: true },
    { key: "brand", col: "brand", type: "string", nullable: true },
    /** EasyEcom SKU — used to push orders to fulfillment. */
    { key: "sku", col: "sku", type: "string", sqlType: "VARCHAR(64)", nullable: true, index: true },
    { key: "price", col: "price", type: "int" },
    { key: "salePrice", col: "sale_price", type: "int", nullable: true },
    { key: "currency", col: "currency", type: "string", sqlType: "VARCHAR(8)" },
    { key: "shortDescription", col: "short_description", type: "text" },
    { key: "description", col: "description", type: "text" },
    { key: "emoji", col: "emoji", type: "string", sqlType: "VARCHAR(16)" },
    { key: "gradient", col: "gradient", type: "json" },
    { key: "images", col: "images", type: "json" },
    { key: "ingredients", col: "ingredients", type: "json" },
    { key: "benefits", col: "benefits", type: "json" },
    { key: "benefitDetails", col: "benefit_details", type: "json" },
    { key: "howToUse", col: "how_to_use", type: "text" },
    { key: "howToUseSteps", col: "how_to_use_steps", type: "json" },
    { key: "comparison", col: "comparison", type: "json" },
    { key: "dosage", col: "dosage", type: "string" },
    { key: "rating", col: "rating", type: "decimal" },
    { key: "reviewCount", col: "review_count", type: "int" },
    { key: "reviews", col: "reviews", type: "json" },
    { key: "stock", col: "stock", type: "int" },
    { key: "unit", col: "unit", type: "string", nullable: true },
    { key: "tags", col: "tags", type: "json" },
    { key: "badges", col: "badges", type: "json" },
    /** Purchase options / pack varieties: [{label, unit, price, salePrice}] */
    { key: "variants", col: "variants", type: "json" },
    { key: "video", col: "video", type: "string", nullable: true },
    { key: "faq", col: "faq", type: "json" },
    { key: "highlights", col: "highlights", type: "json" },
    { key: "isBestSeller", col: "is_best_seller", type: "bool" },
    { key: "isFeatured", col: "is_featured", type: "bool" },
    { key: "isNewArrival", col: "is_new_arrival", type: "bool" },
    /**
     * Published on the website. Inactive products stay in the panel with all
     * their data but disappear from the storefront - the safe way to retire a
     * product without deleting its history.
     */
    { key: "active", col: "active", type: "bool" },
    /**
     * Sellable right now. Separate from `stock` on purpose: the owner may need
     * to stop sales immediately (quality hold, supplier issue) without editing
     * the counted inventory.
     */
    { key: "inStock", col: "in_stock", type: "bool" },
    { key: "seoTitle", col: "seo_title", type: "string", nullable: true },
    { key: "seoDescription", col: "seo_description", type: "text", nullable: true },
    { key: "createdAt", col: "created_at", type: "datetime", nullable: true },
    ts("updated"),
  ],
};

/* ------------------------------ Categories ------------------------------ */
const categories: Model = {
  name: "categories",
  table: "categories",
  pk: "id",
  pkCol: "id",
  pkFromUser: true,
  defaultSort: "name ASC",
  searchCols: ["name", "slug"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "name", col: "name", type: "string" },
    { key: "slug", col: "slug", type: "string", unique: true },
    { key: "emoji", col: "emoji", type: "string", sqlType: "VARCHAR(16)" },
    { key: "description", col: "description", type: "string" },
    { key: "longDescription", col: "long_description", type: "text", nullable: true },
    { key: "gradient", col: "gradient", type: "json" },
    { key: "image", col: "image", type: "string", nullable: true },
    { key: "productCount", col: "product_count", type: "int" },
    { key: "featured", col: "featured", type: "bool" },
    /** Published on the website. Off = hidden from menus, listings and sitemap. */
    { key: "active", col: "active", type: "bool" },
    /** Display order on the storefront (lower first); ties fall back to name. */
    { key: "sortOrder", col: "sort_order", type: "int", nullable: true },
    { key: "seoTitle", col: "seo_title", type: "string", nullable: true },
    { key: "seoDescription", col: "seo_description", type: "text", nullable: true },
    ts("created"),
    ts("updated"),
  ],
};

/* -------------------------------- Blog --------------------------------- */
const blog: Model = {
  name: "blog",
  table: "blog_posts",
  pk: "id",
  pkCol: "id",
  pkFromUser: true,
  defaultSort: "date DESC",
  searchCols: ["title", "slug", "category", "author"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "title", col: "title", type: "string" },
    { key: "slug", col: "slug", type: "string", unique: true },
    { key: "excerpt", col: "excerpt", type: "text" },
    { key: "content", col: "content", type: "text" },
    { key: "emoji", col: "emoji", type: "string", sqlType: "VARCHAR(16)" },
    { key: "gradient", col: "gradient", type: "json" },
    { key: "image", col: "image", type: "string", nullable: true },
    { key: "category", col: "category", type: "string", index: true },
    { key: "author", col: "author", type: "string" },
    { key: "authorAvatar", col: "author_avatar", type: "string", sqlType: "VARCHAR(16)" },
    { key: "date", col: "date", type: "string", sqlType: "VARCHAR(40)" },
    { key: "readTime", col: "read_time", type: "string", sqlType: "VARCHAR(40)" },
    { key: "tags", col: "tags", type: "json" },
    { key: "seoTitle", col: "seo_title", type: "string", nullable: true },
    { key: "seoDescription", col: "seo_description", type: "text", nullable: true },
    ts("created"),
    ts("updated"),
  ],
};

/* ------------------------------- Coupons ------------------------------- */
const coupons: Model = {
  name: "coupons",
  table: "coupons",
  pk: "code",
  pkCol: "code",
  pkFromUser: true,
  defaultSort: "code ASC",
  searchCols: ["code", "description"],
  fields: [
    { key: "code", col: "code", type: "string", sqlType: "VARCHAR(64)" },
    { key: "type", col: "type", type: "string", sqlType: "VARCHAR(16)" },
    { key: "value", col: "value", type: "int" },
    { key: "minOrder", col: "min_order", type: "int", nullable: true },
    { key: "maxDiscount", col: "max_discount", type: "int", nullable: true },
    { key: "description", col: "description", type: "string" },
    { key: "active", col: "active", type: "bool" },
    ts("created"),
    ts("updated"),
  ],
};

/* ------------------------------- Banners ------------------------------- */
const banners: Model = {
  name: "banners",
  table: "banners",
  pk: "id",
  pkCol: "id",
  pkFromUser: true,
  defaultSort: "sort_order ASC",
  searchCols: ["title", "subtitle"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "subtitle", col: "subtitle", type: "string" },
    { key: "title", col: "title", type: "text" },
    { key: "description", col: "description", type: "text" },
    { key: "emoji", col: "emoji", type: "string", sqlType: "VARCHAR(16)", nullable: true },
    { key: "image", col: "image", type: "string", nullable: true },
    { key: "mobileImage", col: "mobile_image", type: "string", nullable: true },
    { key: "buttonText", col: "button_text", type: "string" },
    { key: "buttonLink", col: "button_link", type: "string" },
    { key: "secondaryButtonText", col: "secondary_button_text", type: "string", nullable: true },
    { key: "secondaryButtonLink", col: "secondary_button_link", type: "string", nullable: true },
    { key: "backgroundColor", col: "background_color", type: "string" },
    { key: "artBackground", col: "art_background", type: "string", nullable: true },
    { key: "sortOrder", col: "sort_order", type: "int" },
    { key: "active", col: "active", type: "bool" },
    ts("created"),
    ts("updated"),
  ],
};

/* ----------------------------- Testimonials ---------------------------- */
const testimonials: Model = {
  name: "testimonials",
  table: "testimonials",
  pk: "id",
  pkCol: "id",
  pkFromUser: true,
  defaultSort: "sort_order ASC",
  searchCols: ["name", "quote", "location"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "name", col: "name", type: "string" },
    // Holds an emoji or a photo path, so it needs URL-sized room.
    { key: "avatar", col: "avatar", type: "string", sqlType: "VARCHAR(255)" },
    { key: "role", col: "role", type: "string", nullable: true },
    { key: "rating", col: "rating", type: "int" },
    { key: "quote", col: "quote", type: "text" },
    { key: "location", col: "location", type: "string", nullable: true },
    { key: "sortOrder", col: "sort_order", type: "int" },
    ts("created"),
    ts("updated"),
  ],
};

/* -------------------------------- FAQs --------------------------------- */
const faqs: Model = {
  name: "faqs",
  table: "faqs",
  pk: "id",
  pkCol: "id",
  defaultSort: "sort_order ASC",
  searchCols: ["question", "answer"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "question", col: "question", type: "text" },
    { key: "answer", col: "answer", type: "text" },
    { key: "category", col: "category", type: "string", nullable: true },
    { key: "sortOrder", col: "sort_order", type: "int" },
    ts("created"),
    ts("updated"),
  ],
};

/* ------------------------------- Orders -------------------------------- */
const orders: Model = {
  name: "orders",
  table: "orders",
  pk: "id",
  pkCol: "id",
  defaultSort: "created_at DESC",
  searchCols: ["order_number", "customer_name", "customer_mobile", "state"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "orderNumber", col: "order_number", type: "string", index: true },
    { key: "customerName", col: "customer_name", type: "string" },
    { key: "customerMobile", col: "customer_mobile", type: "string", sqlType: "VARCHAR(32)" },
    /**
     * Delivery contact number typed on the checkout form. `customerMobile` is
     * the ACCOUNT identity (the OTP-verified login number) and must stay that
     * way; this is the number the courier should actually call, which can
     * differ when someone orders on a family member's behalf.
     */
    { key: "shippingPhone", col: "shipping_phone", type: "string", sqlType: "VARCHAR(32)", nullable: true },
    { key: "customerEmail", col: "customer_email", type: "string", nullable: true },
    { key: "address", col: "address", type: "text" },
    { key: "city", col: "city", type: "string", nullable: true },
    { key: "state", col: "state", type: "string" },
    { key: "pincode", col: "pincode", type: "string", sqlType: "VARCHAR(16)", nullable: true },
    { key: "items", col: "items", type: "json" },
    { key: "subtotal", col: "subtotal", type: "int" },
    { key: "discount", col: "discount", type: "int" },
    /** Instant discount earned by paying online (0 for COD). */
    { key: "prepaidDiscount", col: "prepaid_discount", type: "int", nullable: true },
    { key: "shipping", col: "shipping", type: "int" },
    { key: "total", col: "total", type: "int" },
    { key: "couponCode", col: "coupon_code", type: "string", nullable: true },
    { key: "paymentMethod", col: "payment_method", type: "string", sqlType: "VARCHAR(24)" },
    /**
     * Rupees already collected. Drives the payment TYPE shown everywhere:
     * 0 = COD (collect the full total on delivery), == total = Prepaid,
     * anything between = Partial (part paid online, balance COD).
     */
    { key: "amountPaid", col: "amount_paid", type: "int", nullable: true },
    { key: "status", col: "status", type: "string", sqlType: "VARCHAR(24)", index: true },
    { key: "notes", col: "notes", type: "text", nullable: true },
    { key: "ip", col: "ip", type: "string", sqlType: "VARCHAR(64)", nullable: true },
    { key: "source", col: "source", type: "string", nullable: true },
    /** Legacy: whether the lead was mirrored into the live CRM `enquiry` table. */
    { key: "crmSynced", col: "crm_synced", type: "bool" },
    /** Whether the order has been pushed to EasyEcom for fulfillment. */
    { key: "easyecomSynced", col: "easyecom_synced", type: "bool", immutable: true },
    /** EasyEcom's returned order reference (set on a successful push). */
    { key: "easyecomRef", col: "easyecom_ref", type: "string", nullable: true, immutable: true },
    /** When the order becomes due to be pushed to EasyEcom (created + hold window). */
    { key: "dispatchAt", col: "dispatch_at", type: "datetime", nullable: true, index: true, immutable: true },
    /** Timestamp of the successful EasyEcom push. */
    { key: "easyecomPushedAt", col: "easyecom_pushed_at", type: "datetime", nullable: true, immutable: true },
    /** How many push attempts have been made. */
    { key: "easyecomAttempts", col: "easyecom_attempts", type: "int", nullable: true, immutable: true },
    /** Last push error (only set while a push is failing). */
    { key: "easyecomError", col: "easyecom_error", type: "text", nullable: true, immutable: true },
    /** Full attempt history: [{ at, ok, ref?, error? }] (last 10 kept). */
    { key: "easyecomLog", col: "easyecom_log", type: "json", immutable: true },
    /** EasyEcom's internal order id (from the push response / status webhook). */
    { key: "easyecomOrderId", col: "easyecom_order_id", type: "string", nullable: true, index: true },
    /* ---- Shipment / fulfillment status (updated by the EasyEcom webhook) ---- */
    /** Raw courier/EasyEcom status text, e.g. "Shipped", "Delivered", "NDR". */
    { key: "fulfillmentStatus", col: "fulfillment_status", type: "string", nullable: true },
    /** When the shipment status was last updated by a webhook. */
    { key: "shipmentStatusAt", col: "shipment_status_at", type: "datetime", nullable: true },
    { key: "trackingNumber", col: "tracking_number", type: "string", sqlType: "VARCHAR(128)", nullable: true },
    { key: "courier", col: "courier", type: "string", nullable: true },
    { key: "trackingUrl", col: "tracking_url", type: "text", nullable: true },
    { key: "ndrReason", col: "ndr_reason", type: "text", nullable: true },
    /** Status timeline shown to customer + admin: [{ at, status, note }]. */
    { key: "statusHistory", col: "status_history", type: "json" },
    /** Last raw webhook payload (admin debugging). */
    { key: "webhookRaw", col: "webhook_raw", type: "json" },
    /* ---- WhatsApp order confirmation (lib/orderNotify.ts) ---- */
    /** When the confirmation went out. Doubles as the once-only send lock. */
    { key: "whatsappSentAt", col: "whatsapp_sent_at", type: "datetime", nullable: true, immutable: true },
    /** Send attempts: [{ at, ok, to, campaign, error? }] (last 10 kept). */
    { key: "whatsappLog", col: "whatsapp_log", type: "json", immutable: true },
    ts("created"),
    ts("updated"),
  ],
};

/* ------------------------------ Customers ------------------------------ */
/** Storefront customers — PHONE is the primary identity ("number is primary"). */
const customers: Model = {
  name: "customers",
  table: "customers",
  pk: "phone",
  pkCol: "phone",
  pkFromUser: true,
  defaultSort: "updated_at DESC",
  searchCols: ["phone", "name", "email"],
  fields: [
    { key: "phone", col: "phone", type: "string", sqlType: "VARCHAR(20)" },
    { key: "name", col: "name", type: "string", nullable: true },
    // UNIQUE (nullable → MySQL allows many NULLs, one row per non-null email).
    { key: "email", col: "email", type: "string", nullable: true, unique: true },
    /** Plaintext password for the optional email login (owner-visible, like admin users). */
    { key: "password", col: "password", type: "string", nullable: true },
    { key: "verified", col: "verified", type: "bool" },
    { key: "lastLoginAt", col: "last_login_at", type: "datetime", nullable: true },
    { key: "ip", col: "ip", type: "string", sqlType: "VARCHAR(64)", nullable: true },
    ts("created"),
    ts("updated"),
  ],
};

/* ------------------------------- OTP codes ----------------------------- */
/** Every issued OTP is stored so the owner can see it (login OTP audit). */
const otpCodes: Model = {
  name: "otpCodes",
  table: "otp_codes",
  pk: "id",
  pkCol: "id",
  defaultSort: "created_at DESC",
  searchCols: ["phone"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "phone", col: "phone", type: "string", sqlType: "VARCHAR(20)", index: true },
    { key: "code", col: "code", type: "string", sqlType: "VARCHAR(12)" },
    { key: "channel", col: "channel", type: "string", sqlType: "VARCHAR(24)" },
    { key: "purpose", col: "purpose", type: "string", sqlType: "VARCHAR(24)", nullable: true },
    { key: "expiresAt", col: "expires_at", type: "datetime" },
    { key: "consumed", col: "consumed", type: "bool" },
    { key: "ip", col: "ip", type: "string", sqlType: "VARCHAR(64)", nullable: true },
    ts("created"),
  ],
};

/* ---------------------------- Wishlist items --------------------------- */
/** Per-customer wishlist rows, timestamped ("watchlist kab kya tha"). */
const wishlistItems: Model = {
  name: "wishlistItems",
  table: "wishlist_items",
  pk: "id",
  pkCol: "id",
  defaultSort: "created_at DESC",
  searchCols: ["phone", "product_slug"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "phone", col: "phone", type: "string", sqlType: "VARCHAR(20)", index: true },
    { key: "productId", col: "product_id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "productSlug", col: "product_slug", type: "string", nullable: true },
    { key: "productName", col: "product_name", type: "string", nullable: true },
    ts("created"),
  ],
};

/* -------------------------------- Carts -------------------------------- */
/** One live cart per customer; status active|converted|abandoned. */
const carts: Model = {
  name: "carts",
  table: "carts",
  pk: "phone",
  pkCol: "phone",
  pkFromUser: true,
  defaultSort: "updated_at DESC",
  searchCols: ["phone", "status"],
  fields: [
    { key: "phone", col: "phone", type: "string", sqlType: "VARCHAR(20)" },
    { key: "items", col: "items", type: "json" },
    { key: "itemCount", col: "item_count", type: "int", nullable: true },
    { key: "subtotal", col: "subtotal", type: "int", nullable: true },
    { key: "couponCode", col: "coupon_code", type: "string", nullable: true },
    { key: "status", col: "status", type: "string", sqlType: "VARCHAR(16)", index: true },
    { key: "lastActivityAt", col: "last_activity_at", type: "datetime", nullable: true },
    ts("created"),
    ts("updated"),
  ],
};

/* ----------------------------- Admin users ----------------------------- */
const users: Model = {
  name: "users",
  table: "admin_users",
  pk: "id",
  pkCol: "id",
  defaultSort: "created_at ASC",
  searchCols: ["name", "email"],
  fields: [
    { key: "id", col: "id", type: "string", sqlType: "VARCHAR(64)" },
    { key: "name", col: "name", type: "string" },
    { key: "email", col: "email", type: "string", unique: true },
    /** Plaintext password — intentionally visible so the owner can read/share it. */
    { key: "password", col: "password", type: "string", sqlType: "VARCHAR(255)", nullable: true },
    { key: "passwordHash", col: "password_hash", type: "string", sqlType: "VARCHAR(255)", hidden: true },
    { key: "role", col: "role", type: "string", sqlType: "VARCHAR(24)" },
    { key: "active", col: "active", type: "bool" },
    { key: "lastLogin", col: "last_login", type: "datetime", nullable: true },
    ts("created"),
    ts("updated"),
  ],
};

export const MODELS: Record<string, Model> = {
  products,
  categories,
  blog,
  coupons,
  banners,
  testimonials,
  faqs,
  orders,
  users,
  customers,
  otpCodes,
  wishlistItems,
  carts,
};

export function getModel(name: string): Model | undefined {
  return MODELS[name];
}

/* --------------------------- Enum-ish helpers -------------------------- */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "ndr",
  "returned",
] as const;
