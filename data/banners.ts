import type { Banner } from "@/types";

/** Hero slider banners — fully dynamic (title, subtitle, image, colors, CTAs). */
export const banners: Banner[] = [
  {
    id: "banner-1",
    subtitle: "Ancient wisdom",
    title: "Everyday wellness,\nrooted in Ayurveda",
    description: "Authentic, lab-tested Ayurvedic formulations crafted from time-honoured herbs for your daily health.",
    emoji: "🌿",
    image: "/images/banners/hero-1.svg",
    buttonText: "Shop the range",
    buttonLink: "/shop",
    secondaryButtonText: "Learn more",
    secondaryButtonLink: "/about",
    backgroundColor: "linear-gradient(120deg,#eaf3ee,#dceee4)",
    artBackground: "linear-gradient(160deg,#cfe6d8,#b6d8c3)",
  },
  {
    id: "banner-2",
    subtitle: "Immunity",
    title: "Build natural\ndefenses, daily",
    description: "Giloy, Tulsi and Amla blends to keep your body's defenses strong all year round.",
    emoji: "🛡️",
    image: "/images/banners/hero-2.svg",
    buttonText: "Boost immunity",
    buttonLink: "/category/immunity",
    backgroundColor: "linear-gradient(120deg,#eef2f7,#e3ecf5)",
    artBackground: "linear-gradient(160deg,#d3e1f0,#bcd2ea)",
  },
  {
    id: "banner-3",
    subtitle: "Strength & vitality",
    title: "Feel your best,\nevery single day",
    description: "Ashwagandha, Shilajit and Safed Musli for energy, stamina and lasting vitality.",
    emoji: "💪",
    image: "/images/banners/hero-3.svg",
    buttonText: "Discover vitality",
    buttonLink: "/category/mens-health",
    backgroundColor: "linear-gradient(120deg,#f6efe8,#f0e4d6)",
    artBackground: "linear-gradient(160deg,#ecdcc8,#e0cab0)",
  },
];
