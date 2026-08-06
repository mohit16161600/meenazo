import type { Product } from "@/types";
import genProducts from "./generated/products.json";

/**
 * MEENAZO PRODUCT CATALOG — 3 real products.
 * ---------------------------------------------------------------------------
 * Fully dynamic: add more objects here (or swap this file for a Laravel API
 * response) and every section, listing, filter, sitemap and related-products
 * block updates automatically. No other file needs editing.
 * ---------------------------------------------------------------------------
 * `products` prefers the published snapshot (data/generated/products.json,
 * written by the admin panel's Publish action) and falls back to this hardcoded
 * catalog when the snapshot is empty/missing.
 */
const fallbackProducts: Product[] = [
  /* ───────────────────────── SLIMPAX ───────────────────────── */
  {
    id: "15",
    name: "Slimpax",
    slug: "slimpax",
    category: "weight-loss",
    brand: "Meenazo",
    sku: "1073", // EasyEcom SKU — Slimpax
    price: 3980,
    salePrice: 1990,
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
    variants: [
      { label: "1 Bottle · 60 capsules", unit: "60 capsules", price: 3980, salePrice: 1990 },
      { label: "2 Bottles · 120 capsules", unit: "120 capsules", price: 7960, salePrice: 3499 },
      { label: "3 Bottles · 180 capsules", unit: "180 capsules", price: 11940, salePrice: 4799 },
    ],
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
    id: "13",
    name: "Meenazo Diasuddhi",
    slug: "diasuddhi",
    category: "diabetes",
    brand: "Meenazo",
    sku: "1071", // EasyEcom SKU — Diasuddhi
    price: 1998,
    salePrice: 999,
    currency: "INR",
    shortDescription: "Ayurvedic support for healthy blood sugar levels · 60 capsules",
    description:
      "More than 100 million people in India live with sugar-related problems today, and another 136 million are in the prediabetic stage. Maybe you know someone going through this.\n\nDiasuddhi Capsules are crafted for those who wish to support their daily blood sugar wellness. It is made with some of the powerful Ayurvedic actives, including Gudmar, Methi, Punarnava, Bael Fruit, Kalonji, Guggal, and Shilajeet.\n\nTaken daily as part of your routine, it supports steady energy through the day, brings more ease around mealtimes, and helps you stay consistent with your wellness goals.\n\nFor best results, take 1 capsule daily or as advised by your healthcare practitioner, along with a balanced diet and regular activity. Diasuddhi is made the traditional Ayurvedic way with no unnecessary additives, just a steady companion for everyday wellness.",
    emoji: "🩸",
    gradient: ["#eaf3ee", "#dceee4"],
    images: ["/images/Diasuddhi.jpg"],
    ingredients: [
      { name: "Gudmar", description: "Traditionally called the “sugar destroyer” in Ayurveda, Gudmar has been studied for its potential role in supporting healthy glucose metabolism and balanced blood sugar levels." },
      { name: "Methi (Fenugreek)", description: "Rich in soluble fibre, Methi seeds have been researched for their potential to support healthy blood sugar levels and aid overall digestive comfort." },
      { name: "Punarnava", description: "Meaning “the renewer” in Sanskrit, Punarnava has been traditionally used and studied for supporting healthy fluid balance and normal kidney function." },
      { name: "Bael Fruit", description: "Valued in Ayurveda for centuries, Bael fruit has been studied for its soothing properties that support digestive wellness and gut comfort." },
      { name: "Kalonji", description: "Kalonji is known for its antioxidant properties and has been researched for its traditional role in supporting metabolic and immune wellness." },
      { name: "Guggal", description: "A traditional Ayurvedic resin, Guggal has been studied for its role in supporting healthy metabolism and maintaining overall lipid balance in the body." },
      { name: "Shilajeet", description: "A mineral-rich Himalayan substance, Shilajeet has been traditionally used and researched for its role in supporting stamina, vitality, and general strength." },
    ],
    benefits: [
      "Supports Daily Energy",
      "Supports Steady Sugar Levels",
      "Helps Manage Cravings",
      "Promotes Metabolic Wellness",
    ],
    benefitDetails: [
      { title: "Supports daily energy", description: "A balanced herbal formulation supports steady energy through the day, helping manage everyday fatigue naturally." },
      { title: "Supports steady sugar levels", description: "This blend of traditional herbs works together to help maintain blood sugar already within a normal range." },
      { title: "Helps manage cravings", description: "Formulated to ease occasional sugar cravings, supporting more mindful eating habits as part of daily life." },
      { title: "Promotes metabolic wellness", description: "Supports your body's natural metabolic processes, contributing to an overall sense of balance and wellbeing." },
    ],
    howToUse:
      "Take 1 capsule daily with a glass of warm water, or as advised by your healthcare practitioner. Pair it with a balanced diet and regular activity, and continue consistently as part of your everyday wellness routine.",
    howToUseSteps: [
      { title: "Take daily", description: "Take 1 capsule daily with a glass of warm water." },
      { title: "Healthy lifestyle", description: "Pair it with a healthy lifestyle and mindful routine." },
      { title: "Stay consistent", description: "Continue regularly as part of your everyday wellness routine." },
    ],
    comparison: [
      { ours: "Ayurvedic ingredients", others: "Synthetic filler ingredients" },
      { ours: "No added preservatives", others: "Preservative-heavy formulations" },
      { ours: "Thoughtfully sourced formulation", others: "Unclear formulation origins" },
      { ours: "Lab-tested for quality", others: "Limited quality testing" },
      { ours: "Transparent ingredient sourcing", others: "Vague sourcing information" },
    ],
    dosage: "1 capsule per day",
    rating: 4.0,
    reviewCount: 96,
    // `avatar` holds a photo path when one is added (see public/images/reviews);
    // left empty it falls back to the reviewer's initial.
    reviews: [
      { id: "dia1", productId: "13", author: "Ramesh Kumar", avatar: "", rating: 5, title: "My morning routine", comment: "Taking Diasuddhi has become a small, enjoyable ritual in my morning routine, something I actually look forward to.", date: "2026-05-28", verified: true },
      { id: "dia2", productId: "13", author: "Anita Sharma", avatar: "", rating: 5, title: "Simple to take", comment: "It's simple to take with warm water and slots easily into my daily schedule without any hassle.", date: "2026-05-19", verified: true },
      { id: "dia3", productId: "13", author: "Priya Manoj", avatar: "", rating: 5, title: "Effective ingredients", comment: "What I like most is that the ingredients feel familiar, like the ones my grandmother used to use.", date: "2026-05-11", verified: true },
      { id: "dia4", productId: "13", author: "Vivek Tiwari", avatar: "", rating: 5, title: "Controlled sweet cravings", comment: "Since being consistent with this, I've noticed I feel a bit more in control around my sweet cravings.", date: "2026-05-04", verified: true },
      { id: "dia5", productId: "13", author: "Sunita Rawat", avatar: "", rating: 5, title: "Transparency", comment: "I really appreciate knowing exactly what's inside the bottle.", date: "2026-04-26", verified: true },
      { id: "dia6", productId: "13", author: "Arjun Diwakar", avatar: "", rating: 5, title: "A comforting habit", comment: "It's quietly become one of those comforting little habits that look after my everyday wellness routine.", date: "2026-04-17", verified: true },
      { id: "dia7", productId: "13", author: "Kavita Joshi", avatar: "", rating: 5, title: "Easy to take", comment: "No odd aftertaste at all, and it's easy to remember since I take it right before meals.", date: "2026-04-09", verified: true },
      { id: "dia8", productId: "13", author: "Manoj Paswal", avatar: "", rating: 5, title: "Managed eating habits", comment: "Adding this to my routine has made me a little more mindful of my everyday eating habits.", date: "2026-03-31", verified: true },
      { id: "dia9", productId: "13", author: "Deepa Nayer", avatar: "", rating: 5, title: "Thoughtful product", comment: "The packaging is neat, the instructions are clear, and I like that it's completely vegetarian.", date: "2026-03-23", verified: true },
      { id: "dia10", productId: "13", author: "Rahul Verma", avatar: "", rating: 5, title: "Recommended to parents", comment: "I've started recommending it to my parents as well — it feels like a thoughtful, natural addition to daily life.", date: "2026-03-14", verified: true },
    ],
    stock: 100,
    unit: "60 capsules",
    variants: [
      { label: "1 Bottle · 60 capsules", unit: "60 capsules", price: 1998, salePrice: 999 },
      { label: "2 Bottles · 120 capsules", unit: "120 capsules", price: 3996, salePrice: 1799 },
      { label: "3 Bottles · 180 capsules", unit: "180 capsules", price: 5994, salePrice: 2499 },
    ],
    tags: ["diabetes", "blood sugar", "glucose", "diasuddhi", "gudmar", "methi", "shilajeet"],
    badges: ["50% OFF"],
    video: null,
    highlights: ["Herbal Formula", "Safe & Gentle", "No Additives", "Made in India"],
    faq: [
      { question: "What is Diasuddhi?", answer: "Diasuddhi is an Ayurvedic supplement formulated with traditional herbs to support healthy blood sugar levels as part of a balanced lifestyle." },
      { question: "What are the key ingredients in Diasuddhi?", answer: "Diasuddhi contains Gudmar, Methi, Punarnava, Bael Fruit, Kalonji, and Guggal Shilajeet, all traditionally valued in Ayurveda." },
      { question: "How should I take Diasuddhi?", answer: "Take 1 capsule daily or as advised by a healthcare professional, as part of a consistent routine." },
      { question: "Is Diasuddhi safe for daily use?", answer: "Diasuddhi is made from natural Ayurvedic ingredients and is intended for regular use. If you're on medication, please consult your doctor first." },
      { question: "Can I take Diasuddhi along with my regular medication?", answer: "We recommend consulting your healthcare provider before combining Diasuddhi with any other medication or supplement." },
      { question: "How long does it take to notice a difference?", answer: "Every individual's body responds differently. Consistent daily use, alongside a balanced diet, is recommended for the best experience." },
      { question: "Are there any side effects of Diasuddhi?", answer: "Diasuddhi is generally well tolerated. If you have allergies or existing health conditions, please consult your doctor before use." },
      { question: "Is Diasuddhi suitable for vegetarians?", answer: "Yes, Diasuddhi is suitable for vegetarians since it's made from plant-based Ayurvedic ingredients." },
      { question: "Can pregnant or breastfeeding women take Diasuddhi?", answer: "We recommend consulting your doctor before use if you are pregnant, breastfeeding, or planning to conceive." },
      { question: "Where are the ingredients sourced from?", answer: "Our ingredients are sourced from trusted growers and undergo quality checks before being used in the formulation." },
    ],
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    seoTitle: "Meenazo Diasuddhi | Ayurvedic Support for Healthy Blood Sugar Levels | 60 Caps",
    seoDescription: "Diasuddhi by Meenazo is an Ayurvedic blend of Gudmar, Methi, Punarnava, Bael Fruit, Kalonji, Guggal & Shilajeet that supports healthy blood sugar, steady energy and metabolic wellness. 60 capsules.",
    createdAt: "2026-04-10",
  },

  /* ───────────────────────── JOSHVEDA ───────────────────────── */
  {
    id: "14",
    name: "Joshveda",
    slug: "joshveda",
    category: "mens-health",
    brand: "Meenazo",
    sku: "1072", // EasyEcom SKU — Joshveda
    price: 4598,
    salePrice: 2299,
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
    variants: [
      { label: "1 Bottle · 60 capsules", unit: "60 capsules", price: 4598, salePrice: 2299 },
      { label: "2 Bottles · 120 capsules", unit: "120 capsules", price: 9196, salePrice: 3999 },
      { label: "3 Bottles · 180 capsules", unit: "180 capsules", price: 13794, salePrice: 5499 },
    ],
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

/**
 * Published catalogue. A product switched OFF in the panel (`active: false`)
 * is dropped here, so it vanishes from every listing, the sitemap and search
 * at once - the whole point of the panel's Active toggle. Anything without the
 * flag (older snapshots, the fallback list) counts as active.
 */
type PublishedProduct = Product & { active?: boolean };

export const products: Product[] =
  Array.isArray(genProducts) && (genProducts as unknown[]).length
    ? (genProducts as unknown as PublishedProduct[]).filter((p) => p.active !== false)
    : fallbackProducts;

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
