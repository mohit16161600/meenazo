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

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string; // category slug
  brand?: string;
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
  benefits: string[];
  howToUse: string;
  dosage: string;
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  stock: number;
  unit?: string; // e.g. "60 capsules"
  tags: string[];
  badges?: string[]; // e.g. ["Bestseller","-20%"]
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
  | "cancelled";

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
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress?: Address;
  createdAt: string; // ISO
  estimatedDelivery?: string;
}

/* ----------------------------- Auth ----------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  otp?: string; // dummy OTP surfaced for demo convenience
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
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  shippingCharge: number;
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
