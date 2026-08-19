import type { SiteConfig } from "@/types";
import genSite from "./generated/site.json";

/**
 * Single source of truth for brand identity & global settings.
 * Change the brand here (or via the admin panel → Publish) and it updates
 * across the entire site. The published snapshot (data/generated/site.json)
 * is merged on top of this fallback.
 */
const fallbackSiteConfig: SiteConfig = {
  name: "Meenazo",
  tagline: "Ancient Ayurveda, Modern Wellness",
  description:
    "Meenazo brings you 100% herbal, made-in-India Ayurvedic formulations crafted from time-honoured herbs — for weight management, blood-sugar balance, men's wellness and more.",
  logoEmoji: "🌿",
  logoImage: "/images/meenazo-logo.webp",
  email: "care@meenazo.in",
  phone: "+91 93196 93684",
  whatsapp: "919319693684",
  address: "Meenazo Private Limited, E-44/10, Pocket D, Okhla Phase II, New Delhi, Delhi 110020",
  gst: "07AAOCM3628F1ZC",
  pan: "AAOCM3628F",
  currency: "INR",
  currencySymbol: "₹",
  freeShippingThreshold: 499,
  shippingCharge: 49,
  // Instant discount for prepaid (online) orders — set to 0 in the panel to
  // switch the whole offer off (badge, savings line and the charged amount).
  prepaidDiscountPercent: 15,
  prepaidDiscountMax: 0,
  // Cash on Delivery limits (panel-editable, enforced server-side):
  // orders above ₹4,000 are prepaid-only, and one number can place a COD order
  // only once an hour.
  codMaxOrderValue: 4000,
  codCooldownMinutes: 60,
  // Master on/off switches for the two payment methods (panel → Settings →
  // Payment options). Turning one off greys its card at checkout AND makes the
  // matching order route refuse — the browser is never trusted with this.
  codEnabled: true,
  onlinePaymentEnabled: true,
  announcements: [
    "✦ Flat 50% OFF on all products · 100% herbal, made in India",
    "🌿 Extra 15% off your first order — use code MEENA15",
    "📞 Talk to our Ayurvedic experts: +91 93196 93684",
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com", icon: "📷" },
    { label: "Facebook", href: "https://facebook.com", icon: "📘" },
    { label: "YouTube", href: "https://youtube.com", icon: "▶️" },
    { label: "Twitter", href: "https://twitter.com", icon: "🐦" },
    { label: "WhatsApp", href: "https://wa.me/919319693684", icon: "💬" },
  ],
  paymentMethods: [
    { label: "Visa", icon: "💳" },
    { label: "Mastercard", icon: "💳" },
    { label: "UPI", icon: "📲" },
    { label: "Razorpay", icon: "⚡" },
    { label: "Cash on Delivery", icon: "💵" },
  ],
};

export const siteConfig: SiteConfig =
  genSite && typeof genSite === "object" && Object.keys(genSite).length
    ? { ...fallbackSiteConfig, ...(genSite as Partial<SiteConfig>) }
    : fallbackSiteConfig;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://meenazo.com";
