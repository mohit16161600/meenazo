/**
 * Meenazo — Central type contract.
 * Every data module, store, service and component imports from here.
 * Shapes mirror what a future Laravel API is expected to return.
 */

/* ----------------------------- Catalog ----------------------------- */

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  /** Short tagline shown on category cards */
  description: string;
  /** Optional longer copy for the category landing page */
  longDescription?: string;
  /** Gradient pair used for the placeholder art (CSS colors) */
  gradient: [string, string];
  /** Optional image (falls back to gradient + emoji art) */
  image?: string;
  productCount: number;
  featured?: boolean;
  /** Published on the site. Undefined counts as active (older snapshots). */
  active?: boolean;
  /** Display order on the storefront; lower first, name breaks ties. */
  sortOrder?: number | null;
  /** Overrides for the search-engine listing; fall back to name/description. */
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface Review {
  id: string;
  productId?: string;
  author: string;
  avatar: string; // emoji or image url
  rating: number; // 0-5
  title?: string;
  comment: string;
  date: string; // ISO
  verified: boolean;
  helpful?: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProductIngredient {
  name: string;
  amount?: string;
  description?: string;
}

/** A benefit with its own explanation, used for the product story cards. */
export interface ProductBenefit {
  title: string;
  description: string;
}

/** One step of the "how to use" ritual band. */
export interface ProductStep {
  title: string;
  description: string;
}

/** One row of the "us vs the rest" comparison table on the product page. */
export interface ProductComparisonRow {
  /** What this product does. */
  ours: string;
  /** The matching shortcoming of typical alternatives. */
  others: string;
}

/** A purchasable variety / pack option of a product (e.g. "Pack of 2"). */
export interface ProductVariant {
  label: string; // e.g. "Pack of 2 — 120 capsules"
  unit?: string;
  price: number;
  salePrice?: number | null;
  /** EasyEcom SKU for this specific pack (falls back to the product SKU). */
  sku?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string; // category slug
  brand?: string;
  /** EasyEcom SKU used when pushing orders to fulfillment. */
  sku?: string | null;
  price: number;
  salePrice?: number | null;
  currency?: string;
  shortDescription: string;
  description: string;
  /** Emoji used as the primary gradient-art placeholder */
  emoji: string;
  /** Gradient pair for the art placeholder */
  gradient?: [string, string];
  /** Real image URLs (optional). When empty we render the emoji/gradient art. */
  images: string[];
  ingredients: ProductIngredient[];
  /** Short benefit lines — the chips and quick lists. */
  benefits: string[];
  /** Optional richer benefit cards. Falls back to `benefits` when absent. */
  benefitDetails?: ProductBenefit[];
  howToUse: string;
  /** Optional ritual steps. Falls back to generic dosage-derived steps. */
  howToUseSteps?: ProductStep[];
  /** Optional comparison table against typical alternatives. */
  comparison?: ProductComparisonRow[];
  dosage: string;
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  stock: number;
  unit?: string; // e.g. "60 capsules"
  tags: string[];
  badges?: string[]; // e.g. ["Bestseller","-20%"]
  /** Optional purchase varieties / pack options. */
  variants?: ProductVariant[];
  video?: string | null;
  faq?: FAQItem[];
  highlights?: string[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
}

/* ----------------------------- Marketing ----------------------------- */

export interface Banner {
  id: string;
  title: string;
  subtitle: string; // the eyebrow
  description: string;
  /** Emoji art shown when no image present */
  emoji?: string;
  image?: string;
  mobileImage?: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  /** CSS background for the slide */
  backgroundColor: string;
  /** CSS background for the art panel */
  artBackground?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  rating: number;
  quote: string;
  location?: string;
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface BeforeAfter {
  id: string;
  name: string;
  concern: string;
  duration: string;
  beforeEmoji: string;
  afterEmoji: string;
  beforeImage?: string;
  afterImage?: string;
  result: string;
  product?: string;
}

export interface Certification {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface TrustBadge {
  icon: string;
  label: string;
  sublabel?: string;
}

export interface InstagramPost {
  id: string;
  emoji: string;
  gradient: [string, string];
  image?: string;
  likes: number;
  link: string;
}

export interface DoctorInfo {
  name: string;
  degree: string;
  title: string;
  experience: string;
  avatar: string;
  image?: string;
  bio: string;
  videoUrl: string;
  eyebrow: string;
  heading: string;
}

/* ----------------------------- Blog ----------------------------- */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // markdown-ish / html string
  emoji: string;
  gradient: [string, string];
  image?: string;
  category: string;
  author: string;
  authorAvatar: string;
  date: string; // ISO
  readTime: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

/* ----------------------------- Commerce ----------------------------- */

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number; // effective price (salePrice if present)
  image?: string;
  emoji: string;
  gradient?: [string, string];
  quantity: number;
  unit?: string;
  /** Chosen variety / pack option label (if the product has variants). */
  variant?: string;
  stock: number;
}

export interface Coupon {
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  description: string;
  active: boolean;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  type: "home" | "work" | "other";
  isDefault?: boolean;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "ndr" // delivery attempt failed (Non-Delivery Report)
  | "returned"; // RTO / returned to origin

export type PaymentMethod = "cod" | "razorpay" | "upi";

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  emoji: string;
  image?: string;
  price: number;
  quantity: number;
  unit?: string;
  /** Chosen variety / pack option label (if the product has variants). */
  variant?: string;
  /** price × quantity, precomputed for reporting. */
  lineTotal?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  /** Coupon discount. */
  discount: number;
  /** Instant discount earned by paying online (0 / absent for COD). */
  prepaidDiscount?: number;
  shipping: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress?: Address;
  createdAt: string; // ISO
  estimatedDelivery?: string;
  /* ---- Fulfillment / shipment tracking (from the EasyEcom status webhook) ---- */
  /** Raw courier/EasyEcom status text, e.g. "Out For Delivery", "NDR". */
  fulfillmentStatus?: string;
  trackingNumber?: string; // AWB
  courier?: string;
  trackingUrl?: string;
  ndrReason?: string;
  /** Human status timeline shown to the customer + admin. */
  statusHistory?: { at: string; status: string; note?: string }[];
}

/* ----------------------------- Auth ----------------------------- */

export interface User {
  id: string; // == phone (the primary identity)
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  verified?: boolean;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  otp?: string; // dummy OTP surfaced for demo convenience
  devCode?: string; // OTP shown in dev / when no SMS provider is configured
  channels?: string; // channels the OTP was sent over (e.g. "sms+whatsapp")
}

/* ----------------------------- Navigation / Site ----------------------------- */

export interface MegaMenuColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface NavItem {
  label: string;
  href: string;
  /** When present, renders a mega menu panel */
  megaMenu?: {
    columns: MegaMenuColumn[];
    featured?: {
      title: string;
      description: string;
      emoji: string;
      href: string;
      buttonText: string;
    };
  };
  /** Simple dropdown of links */
  dropdown?: { label: string; href: string }[];
}

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  logoEmoji: string;
  /** Real logo artwork. Empty falls back to the leaf mark + wordmark. */
  logoImage?: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  gst: string;
  pan: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  shippingCharge: number;
  /**
   * Instant discount for paying online instead of COD, in percent of the
   * post-coupon subtotal. 0 disables it everywhere (badge, summary and the
   * amount actually charged). Enforced on the server in lib/orderCapture.ts —
   * the browser never gets to decide it.
   */
  prepaidDiscountPercent: number;
  /** Cap on the prepaid discount in ₹ (0 = uncapped). */
  prepaidDiscountMax: number;
  announcements: string[];
  social: { label: string; href: string; icon: string }[];
  paymentMethods: { label: string; icon: string }[];
}

/* ----------------------------- UI helpers ----------------------------- */

export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest"
  | "name-asc";

export interface ProductFilters {
  query?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  tags?: string[];
  sort?: SortOption;
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}
