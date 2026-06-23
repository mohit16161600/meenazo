import type { SiteConfig } from "@/types";

/**
 * Single source of truth for brand identity & global settings.
 * Change the brand here and it updates across the entire site.
 */
export const siteConfig: SiteConfig = {
  name: "Meenazo",
  tagline: "Ancient Ayurveda, Modern Wellness",
  description:
    "Meenazo brings you 100% herbal, made-in-India Ayurvedic formulations crafted from time-honoured herbs — for weight management, blood-sugar balance, men's wellness and more.",
  logoEmoji: "🌿",
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

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://meenazo.com";
