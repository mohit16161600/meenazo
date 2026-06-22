import type { Product } from "@/types";

/**
 * MEENAZO PRODUCT CATALOG — 3 real products.
 * ---------------------------------------------------------------------------
 * Fully dynamic: add more objects here (or swap this file for a Laravel API
 * response) and every section, listing, filter, sitemap and related-products
 * block updates automatically. No other file needs editing.
 * ---------------------------------------------------------------------------
 */
export const products: Product[] = [
  /* ───────────────────────── SLIMPAX ───────────────────────── */
  {
    id: "p-slimpax",
    name: "Slimpax",
    slug: "slimpax",
    category: "weight-loss",
    brand: "Meenazo",
    price: 3998,
    salePrice: 1999,
    currency: "INR",
    shortDescription: "Ayurvedic Weight Management · 60 capsules",
    description:
      "Regular use of Slimpax speeds up your metabolism so much that the body's internal fat-burning capacity increases, which helps in reducing excess weight; if used as directed, it can prove to be very helpful. Two of the ingredients used for weight reduction are considered the most effective. Slimpax is a 100% herbal, made-in-India Ayurvedic proprietary medicine, crafted to support healthy, sustainable weight management the natural way.",
    emoji: "⚖️",
    gradient: ["#f6efe8", "#f0e4d6"],
    images: ["/images/Slimpax.jpg"],
    ingredients: [
      { name: "Punarnava", amount: "—", description: "Supports healthy metabolism and water balance." },
      { name: "Ashwagandha", amount: "—", description: "Adaptogen that supports stress balance and energy." },
      { name: "Jaiphal (Nutmeg)", amount: "—", description: "Traditionally used to aid digestion." },
      { name: "Ajwain (Carom)", amount: "—", description: "Supports digestion and metabolism." },
      { name: "Tejpatta (Bay Leaf)", amount: "—", description: "Supports glucose and fat metabolism." },
      { name: "Triphala", amount: "—", description: "Classical blend for gentle detox and digestion." },
    ],
    benefits: [
      "Supports healthy weight management",
      "Helps boost metabolism naturally",
      "Improves digestive function",
      "Helps curb appetite",
      "Helps you feel light & energetic",
    ],
    howToUse:
      "Take one capsule daily before breakfast and one capsule on an empty stomach in the evening. Use with warm water for best results. Follow a diet chart and do regular exercise for better results.",
    dosage: "2 capsules per day",
    rating: 4.0,
    reviewCount: 128,
    reviews: [
      { id: "slx1", productId: "p-slimpax", author: "Pooja D.", avatar: "🙂", rating: 5, title: "Feeling lighter", comment: "Combined with walking and clean eating, I feel much lighter and my digestion has improved. Gentle on the stomach.", date: "2026-05-14", verified: true, helpful: 41 },
      { id: "slx2", productId: "p-slimpax", author: "Rahul V.", avatar: "😀", rating: 4, title: "Works with consistency", comment: "No jitters at all. Took about a month but my appetite is more controlled now.", date: "2026-04-22", verified: true, helpful: 23 },
    ],
    stock: 100,
    unit: "60 capsules",
    tags: ["weight loss", "weight management", "metabolism", "slimpax", "fat burner", "triphala"],
    badges: ["Bestseller", "50% OFF"],
    video: null,
    highlights: ["Herbal Formula", "Safe & Gentle", "No Additives", "Made in India"],
    faq: [
      { question: "How should I take Slimpax for best results?", answer: "Take one capsule before breakfast and one in the evening on an empty stomach with warm water, alongside a balanced diet and regular exercise." },
      { question: "Is Slimpax safe and natural?", answer: "Yes. Slimpax is a 100% herbal Ayurvedic proprietary medicine made in India with no additives. Consult your physician if pregnant, nursing or on medication." },
      { question: "When will I see results?", answer: "Results build gradually and vary by individual. Most users notice changes within 4–8 weeks of consistent use with diet and exercise." },
    ],
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    seoTitle: "Slimpax — Ayurvedic Weight Management Capsules | Meenazo",
    seoDescription: "Slimpax by Meenazo is a 100% herbal Ayurvedic weight-management formula with Punarnava, Ashwagandha, Triphala & more. Boosts metabolism naturally. 60 capsules.",
    createdAt: "2026-03-15",
  },

  /* ───────────────────────── DIASUDDHI ───────────────────────── */
  {
    id: "p-diasuddhi",
    name: "Herbal Diasuddhi Capsule",
    slug: "diasuddhi",
    category: "diabetes",
    brand: "Meenazo",
    price: 3998,
    salePrice: 1999,
    currency: "INR",
    shortDescription: "Balances Glucose Levels · 60 capsules",
    description:
      "Herbal Diasuddhi Capsule is a 100% natural and scientifically proven blend of herbal ingredients that support healthy blood sugar. With the unique properties of each herb present in the capsule, it helps you maintain optimal blood glucose levels in diabetic patients. It increases the ability of your body's cells to use glucose more efficiently. It also helps with weight support, and its antioxidant properties protect the pancreas from oxidative damage and delay the progression of complications related to sugar levels.",
    emoji: "🩸",
    gradient: ["#eaf3ee", "#dceee4"],
    images: ["/images/Diasuddhi.jpg"],
    ingredients: [
      { name: "Cinnamon", amount: "—", description: "Supports insulin sensitivity." },
      { name: "Milk Thistle", amount: "—", description: "Antioxidant support for the liver." },
      { name: "Bitter Melon (Karela)", amount: "—", description: "Supports healthy glucose metabolism." },
      { name: "Fenugreek (Methi)", amount: "—", description: "Supports blood-sugar balance." },
      { name: "Aloe Vera", amount: "—", description: "Supports digestion and metabolism." },
      { name: "Gymnema (Gurmar)", amount: "—", description: "The classical 'sugar destroyer' herb." },
    ],
    benefits: [
      "Supports healthy blood-sugar levels",
      "Improves cellular glucose utilisation",
      "Antioxidant protection for the pancreas",
      "Supports healthy weight",
      "100% natural herbal blend",
    ],
    howToUse:
      "Take one capsule daily before breakfast and one capsule in the evening on an empty stomach. Use with warm water for best results. Follow the diet chart and exercise regularly for better results.",
    dosage: "2 capsules per day",
    rating: 4.0,
    reviewCount: 96,
    reviews: [
      { id: "dia1", productId: "p-diasuddhi", author: "Suresh P.", avatar: "🙂", rating: 5, title: "Stable readings", comment: "Along with diet, my fasting numbers have been steadier. Doctor is satisfied with the progress.", date: "2026-05-03", verified: true, helpful: 57 },
      { id: "dia2", productId: "p-diasuddhi", author: "Lakshmi R.", avatar: "😌", rating: 4, title: "Gentle & natural", comment: "Easy on the stomach and I feel less sugar craving after meals.", date: "2026-03-29", verified: true, helpful: 31 },
    ],
    stock: 100,
    unit: "60 capsules",
    tags: ["diabetes", "blood sugar", "glucose", "diasuddhi", "gymnema", "karela"],
    badges: ["50% OFF"],
    video: null,
    highlights: ["Herbal Formula", "Safe & Gentle", "No Additives", "Made in India"],
    faq: [
      { question: "Can I take this with my diabetes medication?", answer: "Please consult your physician before combining with prescription medication, as your dosage may need monitoring." },
      { question: "Is this a cure for diabetes?", answer: "No. It is a supportive supplement intended to complement a healthy diet and lifestyle, not to replace medical treatment." },
      { question: "How do I take Diasuddhi?", answer: "One capsule before breakfast and one in the evening on an empty stomach with warm water, with diet and exercise." },
    ],
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    seoTitle: "Herbal Diasuddhi Capsule — Ayurvedic Blood Sugar Support | Meenazo",
    seoDescription: "Diasuddhi by Meenazo is a 100% natural herbal blend with Gymnema, Karela, Fenugreek, Cinnamon & more to support healthy blood glucose levels. 60 capsules.",
    createdAt: "2026-04-10",
  },

  /* ───────────────────────── JOSHVEDA ───────────────────────── */
  {
    id: "p-joshveda",
    name: "Joshveda",
    slug: "joshveda",
    category: "mens-health",
    brand: "Meenazo",
    price: 3998,
    salePrice: 1999,
    currency: "INR",
    shortDescription: "For Men's Wellness — Stamina & Strength · 60 capsules",
    description:
      "Joshveda capsule is a Men's Wellness (Health) herbal supplement. It helps to improve stamina. It is specifically formulated with rare herbs that improve men's stamina and overall health. This power capsule for men can increase stamina. By using Joshveda regularly, men can build stamina — if it is used as directed, it can prove to be very helpful. A 100% herbal, made-in-India Ayurvedic proprietary medicine.",
    emoji: "💪",
    gradient: ["#eef2f7", "#e3ecf5"],
    images: ["/images/joshveda.png"],
    ingredients: [
      { name: "Indian Ginseng / Ashwagandha", amount: "Withania somnifera", description: "Adaptogen for stamina, strength and stress balance." },
      { name: "Shudh Shilajit", amount: "Asphaltum Punjabianum", description: "Himalayan mineral resin for energy and vitality." },
      { name: "Tongkat Ali", amount: "—", description: "Traditionally used to support male vitality." },
      { name: "Gokhru", amount: "Tribulus terrestris", description: "Supports stamina and hormonal health." },
      { name: "Safed Musli", amount: "—", description: "Classical rasayana for strength and vigour." },
      { name: "Kaunchbeej", amount: "Mucuna pruriens", description: "Supports mood, drive and wellbeing." },
      { name: "Maca Root", amount: "—", description: "Supports energy and endurance." },
      { name: "Amalaki (Amla)", amount: "—", description: "Antioxidant-rich rejuvenator." },
    ],
    benefits: [
      "Supports daily stamina & strength",
      "Helps maintain hormonal health",
      "Supports emotional wellbeing",
      "Helps with clarity & focus",
      "Boosts energy & vitality",
    ],
    howToUse:
      "Take one capsule daily at bedtime with milk or water, half an hour after dinner. Use with warm water for best results. Follow a diet chart and do regular exercise for better results.",
    dosage: "1 capsule per day",
    rating: 4.0,
    reviewCount: 84,
    reviews: [
      { id: "josh1", productId: "p-joshveda", author: "Vikram S.", avatar: "😀", rating: 5, title: "Noticeable stamina", comment: "Energy levels through the day feel steadier and recovery is better. Genuine herbal blend.", date: "2026-05-09", verified: true, helpful: 38 },
      { id: "josh2", productId: "p-joshveda", author: "Anil K.", avatar: "😌", rating: 4, title: "Good for focus", comment: "Felt calmer and more focused after a few weeks. Taking it at bedtime works well for me.", date: "2026-04-18", verified: true, helpful: 19 },
    ],
    stock: 100,
    unit: "60 capsules",
    tags: ["men's health", "stamina", "strength", "joshveda", "ashwagandha", "shilajit", "vitality"],
    badges: ["New", "50% OFF"],
    video: null,
    highlights: ["Herbal Formula", "Safe & Gentle", "No Additives", "Made in India"],
    faq: [
      { question: "How do I take Joshveda?", answer: "Take one capsule daily at bedtime with milk or water, about half an hour after dinner, alongside a balanced diet and regular exercise." },
      { question: "Is Joshveda safe?", answer: "Yes — it is a 100% herbal Ayurvedic proprietary medicine made in India. Consult your physician if you have a medical condition or are on medication." },
      { question: "When will I notice benefits?", answer: "Benefits build gradually; most users notice improved energy and stamina within a few weeks of consistent use." },
    ],
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: true,
    seoTitle: "Joshveda — Ayurvedic Men's Wellness, Stamina & Strength | Meenazo",
    seoDescription: "Joshveda by Meenazo is a herbal men's wellness formula with Ashwagandha, Shilajit, Safed Musli, Gokhru & more for stamina, strength and vitality. 60 capsules.",
    createdAt: "2026-05-20",
  },
];

/* ----------------------------- Derived helpers ----------------------------- */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

/** Best sellers (falls back to top-rated so the section is never empty). */
export const bestSellers = (() => {
  const flagged = products.filter((p) => p.isBestSeller);
  const list = flagged.length ? flagged : [...products].sort((a, b) => b.rating - a.rating);
  return list.slice(0, 3);
})();

/** Featured (falls back to all products). */
export const featuredProducts = (() => {
  const flagged = products.filter((p) => p.isFeatured);
  return (flagged.length ? flagged : products).slice(0, 6);
})();

/** New arrivals, newest first (falls back to all products sorted by date). */
export const newArrivals = (() => {
  const flagged = products.filter((p) => p.isNewArrival);
  const list = flagged.length ? flagged : products;
  return [...list].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 6);
})();
