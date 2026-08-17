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
    shortDescription: "Ayurvedic support for healthy weight management · 60 capsules",
    description:
      "Somewhere between busy schedules and unhealthy food habits, many of us lose touch with feeling light and active. Sluggish digestion, sudden cravings, and low energy can quietly become part of everyday life.\n\nSlimpax Capsules are designed to be part of your daily weight-management routine, working alongside your body's natural metabolic rhythm. It is made with some of the powerful Ayurvedic actives, including Jaiphal, Tejpatta, Lavang, Ashwagandha Leaf, Triphala, Ajwain, and Punarnava.\n\nWhen taken daily, it can help support healthy digestion and metabolism to support an active lifestyle.\n\nFor best results, take 1 capsule 30 minutes before breakfast and 1 capsule 30 minutes before dinner, along with a balanced diet and regular activity.\n\nSlimpax is made with consciously sourced herbs with no unnecessary additives to support your everyday wellness goals.",
    emoji: "⚖️",
    gradient: ["#f6efe8", "#f0e4d6"],
    images: ["/images/Slimpax.jpg"],
    ingredients: [
      { name: "Jaiphal (Nutmeg)", description: "Traditionally used in Ayurveda, Jaiphal has been valued for its role in supporting healthy digestion and easing occasional stomach discomfort." },
      { name: "Tejpatta (Bay Leaf)", description: "Known for its aromatic properties, Tejpatta has been traditionally used to support digestive comfort and the body's natural metabolic processes." },
      { name: "Lavang (Clove)", description: "Rich in antioxidants, Lavang has been researched for its traditional role in supporting digestive wellness and freshness after meals." },
      { name: "Ashwagandha Leaf", description: "A well-known Ayurvedic herb, Ashwagandha Leaf has been studied for its potential role in supporting the body's response to everyday stress." },
      { name: "Triphala", description: "A classic blend of three fruits, Triphala has been traditionally used for centuries to support healthy digestion and gut comfort." },
      { name: "Ajwain (Carom Seeds)", description: "Valued in Ayurveda for its warming properties, Ajwain has been traditionally used to support digestive ease and everyday gut wellness." },
      { name: "Punarnava", description: "It means “the renewer” in Sanskrit, Punarnava has been traditionally used and studied for supporting healthy fluid balance in the body." },
    ],
    benefits: [
      "Helps You Feel Lighter",
      "Supports Natural Metabolism",
      "Ease Occasional Hunger",
      "Supports Active Digestion",
    ],
    benefitsHeadline: "Gentle support for everyday weight management",
    benefitDetails: [
      { title: "Helps you feel lighter", description: "A balanced herbal formulation supports healthy digestion, helping you feel lighter and more active through the day." },
      { title: "Supports natural metabolism", description: "This blend of traditional herbs supports your body's natural metabolism as part of a daily routine." },
      { title: "Eases occasional hunger", description: "Formulated to support a sense of fullness, helping you stay more mindful around snacking and portions." },
      { title: "Supports active digestion", description: "Supports your body's digestive processes, contributing to an overall feeling of ease and lightness after meals." },
    ],
    howToUse:
      "Take 1 capsule 30 minutes before breakfast and 1 capsule 30 minutes before dinner with a glass of warm water, or as advised by your healthcare practitioner. Continue regularly alongside a balanced diet and daily activity.",
    howToUseHeadline: "3 simple steps for an active and fit lifestyle",
    howToUseSteps: [
      { title: "Before breakfast", description: "Take 1 capsule 30 minutes before breakfast with a glass of warm water." },
      { title: "Before dinner", description: "Take 1 capsule 30 minutes before dinner as part of your evening routine." },
      { title: "Stay consistent", description: "Continue regularly, alongside a balanced diet and daily activity." },
    ],
    comparison: [
      { ours: "Ayurvedic ingredients", others: "Synthetic filler ingredients" },
      { ours: "No added preservatives", others: "Preservative-heavy formulations" },
      { ours: "Thoughtfully sourced formulation", others: "Unclear formulation origins" },
      { ours: "Lab-tested for quality", others: "Limited quality testing" },
      { ours: "Transparent ingredient sourcing", others: "Vague sourcing information" },
    ],
    dosage: "2 capsules per day",
    rating: 4.0,
    reviewCount: 128,
    reviews: [
      { id: "slx1", productId: "15", author: "Rohit Sharma", avatar: "", rating: 5, title: "Easy on life", comment: "Taking Slimpax before breakfast has become such an easy habit, I barely think about it anymore.", date: "2026-05-26", verified: true },
      { id: "slx2", productId: "15", author: "Neha Kapoor", avatar: "", rating: 5, title: "Feel lighter", comment: "I genuinely feel a bit lighter and more active since I started being consistent with this.", date: "2026-05-17", verified: true },
      { id: "slx3", productId: "15", author: "Sanjay Mehta", avatar: "", rating: 5, title: "Familiar ingredients", comment: "I liked that the ingredients felt familiar, close to what my mother used to cook with.", date: "2026-05-08", verified: true },
      { id: "slx4", productId: "15", author: "Pooja Iyer", avatar: "", rating: 5, title: "Fewer cravings", comment: "I've noticed I'm a little more in control around evening snacking since starting Slimpax.", date: "2026-04-29", verified: true },
      { id: "slx5", productId: "15", author: "Karan Malhotra", avatar: "", rating: 5, title: "Easy routine", comment: "Simple to fit into my day, one before breakfast, one before dinner. No hassle at all.", date: "2026-04-20", verified: true },
      { id: "slx6", productId: "15", author: "Divya Reddy", avatar: "", rating: 5, title: "Feels natural", comment: "It doesn't feel like a supplement — more like an addition to my daily self-care ritual.", date: "2026-04-11", verified: true },
      { id: "slx7", productId: "15", author: "Ajay Bhatt", avatar: "", rating: 5, title: "Trust the process", comment: "I appreciate that everything on the label is something I can actually pronounce and understand.", date: "2026-04-02", verified: true },
      { id: "slx8", productId: "15", author: "Ritu Sinha", avatar: "", rating: 5, title: "Simple addition", comment: "Easy to remember since I take it right around mealtimes. Fits well into my routine.", date: "2026-03-24", verified: true },
    ],
    stock: 100,
    unit: "60 capsules",
    variants: [
      { label: "1 Bottle · 60 capsules", unit: "60 capsules", price: 3980, salePrice: 1990 },
      { label: "2 Bottles · 120 capsules", unit: "120 capsules", price: 7960, salePrice: 3499 },
      { label: "3 Bottles · 180 capsules", unit: "180 capsules", price: 11940, salePrice: 4799 },
    ],
    tags: ["weight loss", "weight management", "metabolism", "slimpax", "digestion", "triphala"],
    badges: ["Bestseller", "50% OFF"],
    video: null,
    highlights: ["Herbal Formula", "Safe & Gentle", "No Additives", "Made in India"],
    faq: [
      { question: "What is Slimpax?", answer: "Slimpax is an Ayurvedic supplement formulated with traditional herbs to support healthy weight management as part of a balanced lifestyle." },
      { question: "What are the key ingredients in Slimpax?", answer: "Slimpax contains Jaiphal, Tejpatta, Lavang, Ashwagandha Leaf, Triphala, Ajwain, and Punarnava, all traditionally valued in Ayurveda." },
      { question: "How should I take Slimpax?", answer: "Take 1 capsule 30 minutes before meals, or as advised by a healthcare professional." },
      { question: "Is Slimpax safe for daily use?", answer: "Slimpax is made from natural Ayurvedic ingredients and is intended for regular use. If you're on medication, please consult your doctor first." },
      { question: "Can I take Slimpax along with my regular medication?", answer: "We recommend consulting your healthcare provider before combining Slimpax with any other medication or supplement." },
      { question: "How long does it take to notice a difference?", answer: "Every individual's body responds differently. Consistent daily use, alongside a balanced diet, is recommended for the best experience." },
      { question: "Are there any side effects of Slimpax?", answer: "Slimpax is generally well tolerated. If you have allergies or existing health conditions, please consult your doctor before use." },
      { question: "Is Slimpax suitable for vegetarians?", answer: "Yes, Slimpax is suitable for vegetarians since it's made from plant-based Ayurvedic ingredients." },
      { question: "Can pregnant or breastfeeding women take Slimpax?", answer: "We recommend consulting your doctor before use if you are pregnant, breastfeeding, or planning to conceive." },
    ],
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    seoTitle: "Meenazo Slimpax | Ayurvedic Support for Healthy Weight Management | 60 Caps",
    seoDescription: "Slimpax by Meenazo is an Ayurvedic blend of Jaiphal, Tejpatta, Lavang, Ashwagandha Leaf, Triphala, Ajwain & Punarnava that supports healthy digestion, natural metabolism and everyday weight management. 60 capsules.",
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
    shortDescription: "Ayurvedic support for metabolic wellness · 30 capsules",
    description:
      "Busy schedules, irregular meals, and constant stress have made everyday wellness harder to maintain for many adults today.\n\nDiasuddhi Capsules are crafted for those who wish to support their everyday metabolic wellness. It is made with some of the powerful Ayurvedic actives, including Gudmar, Methi, Punarnava, Bael Fruit, Kalonji, Guggal, and Shilajeet.\n\nTaken daily as part of your routine, it supports steady energy through the day, brings more ease around mealtimes, and helps you stay consistent with your wellness goals.\n\nFor best results, take 1 capsule daily or as advised by your healthcare practitioner, along with a balanced diet and regular activity. Diasuddhi is made the traditional Ayurvedic way with no unnecessary additives, just a steady companion for everyday wellness.",
    emoji: "🩸",
    gradient: ["#eaf3ee", "#dceee4"],
    // Gallery order = the order shown on the product page: the pack shot is the
    // main photo, the rest sit in the thumbnail rail underneath it. Each carries
    // its own alt text because these are information graphics — a screen reader
    // announcing "Meenazo Diasuddhi" seven times would lose everything they say.
    images: [
      // The cut-out pack shot leads: it is also what every product CARD shows,
      // and a card needs the bottle whole on a clean ground, not a lifestyle
      // scene whose own backdrop fights the card's tile.
      {
        src: "/images/diasuddhi/9.webp",
        alt: "Meenazo Diasuddhi bottle of 30 Ayurvedic capsules with the herbs it is made from — bael fruit, methi seeds, kalonji and guggal",
      },
      {
        src: "/images/diasuddhi/1.webp",
        alt: "Meenazo Diasuddhi bottle of 60 Ayurvedic capsules, surrounded by its herbs — bael fruit, methi seeds, kalonji and guggal",
      },
      {
        src: "/images/diasuddhi/2.webp",
        alt: "Meenazo Diasuddhi Capsule — Ayurvedic support for mindful sugar habits, a traditional blend crafted for your daily wellness routine",
      },
      {
        src: "/images/diasuddhi/3.webp",
        alt: "Key ingredients inside the Diasuddhi wellness formula: Gudmar, Methi, Punarnava, Guggal, Bael Fruit, Shilajeet and Kalonji",
      },
      {
        src: "/images/diasuddhi/4.webp",
        alt: "How to use Diasuddhi: take 1 capsule a day after meals and make it part of a balanced daily routine. Consult your healthcare provider before use.",
      },
      {
        src: "/images/diasuddhi/5.webp",
        alt: "Made for those who value mindful living — ideal for adults mindful of daily sugar intake, active lifestyles, and anyone seeking Ayurvedic support",
      },
      {
        src: "/images/diasuddhi/6.webp",
        alt: "Diasuddhi benefits: metabolic wellness, sugar-mindful formula, healthy digestion, everyday stress balance, natural detox and sustained energy support",
      },
      {
        src: "/images/diasuddhi/7.webp",
        alt: "How Diasuddhi fits your routine — an easy-to-take capsule format made for consistent, long-term daily use",
      },
    ],
    // Herb photos are 1400×1000 (7:5) — the same ratio the ingredient card's
    // photo band uses, so each one shows in full with nothing cropped away.
    ingredients: [
      { name: "Gudmar", image: "/images/diasuddhi/gudmar.webp", description: "Traditionally used in Ayurveda and researched for its role in supporting healthy metabolic function." },
      { name: "Methi (Fenugreek)", image: "/images/diasuddhi/methi.webp", description: "Rich in soluble fibre, Methi seeds have been researched for their potential to support healthy metabolic function and overall digestive comfort." },
      { name: "Punarnava", image: "/images/diasuddhi/punarnava.webp", description: "Meaning “the renewer” in Sanskrit, Punarnava has been traditionally used and studied for supporting healthy fluid balance and normal kidney function." },
      { name: "Bael Fruit", image: "/images/diasuddhi/bael.webp", description: "Valued in Ayurveda for centuries, Bael fruit has been studied for its soothing properties that support digestive wellness and gut comfort." },
      { name: "Kalonji", image: "/images/diasuddhi/kalonji.webp", description: "Kalonji is known for its antioxidant properties and has been researched for its traditional role in supporting metabolic and immune wellness." },
      { name: "Guggal", image: "/images/diasuddhi/guggal.webp", description: "A traditional Ayurvedic resin, Guggal has been studied for its role in supporting healthy metabolism and maintaining overall lipid balance in the body." },
      { name: "Shilajeet", image: "/images/diasuddhi/shilajeet.webp", description: "A mineral-rich Himalayan substance, Shilajeet has been traditionally used and researched for its role in supporting stamina, vitality, and general strength." },
    ],
    benefits: [
      "Supports Daily Energy",
      "Supports Steady Sugar Levels",
      "Helps Manage Cravings",
      "Promotes Metabolic Wellness",
    ],
    benefitsHeadline: "Gentle, Ayurvedic support for healthy blood sugar & metabolism",
    // These icons are white glyphs on transparency — they are drawn on the
    // card's brand-green tile, never on white, or they'd vanish.
    benefitDetails: [
      { title: "Supports daily energy", image: "/images/diasuddhi/icon-daily-energy.webp", description: "A balanced herbal formulation supports steady energy through the day, helping manage everyday fatigue naturally." },
      { title: "Supports steady sugar levels", image: "/images/diasuddhi/icon-steady-sugar.webp", description: "This blend of traditional herbs works together to support the body's natural metabolic balance." },
      { title: "Helps manage cravings", image: "/images/diasuddhi/icon-manage-cravings.webp", description: "Formulated to ease occasional sugar cravings, supporting more mindful eating habits as part of daily life." },
      { title: "Promotes metabolic wellness", image: "/images/diasuddhi/icon-metabolic-wellness.webp", description: "Supports your body's natural metabolic processes, contributing to an overall sense of balance and wellbeing." },
    ],
    howToUse:
      "Take 1 capsule daily with a glass of warm water, or as advised by your healthcare practitioner. Pair it with a balanced diet and regular activity, and continue consistently as part of your everyday wellness routine.",
    howToUseHeadline: "3 simple steps for healthy blood sugar levels",
    howToUseSteps: [
      { title: "Take daily", image: "/images/diasuddhi/icon-take-daily.webp", description: "Take 1 capsule daily with a glass of warm water." },
      { title: "Healthy lifestyle", image: "/images/diasuddhi/icon-healthy-lifestyle.webp", description: "Pair it with a healthy lifestyle and mindful routine." },
      { title: "Stay consistent", image: "/images/diasuddhi/icon-stay-consistent.webp", description: "Continue regularly as part of your everyday wellness routine." },
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
    unit: "30 capsules",
    variants: [
      { label: "1 Bottle · 30 capsules", unit: "30 capsules", price: 1998, salePrice: 999 },
      { label: "2 Bottles · 60 capsules", unit: "60 capsules", price: 3996, salePrice: 1799 },
      { label: "3 Bottles · 90 capsules", unit: "90 capsules", price: 5994, salePrice: 2499 },
    ],
    tags: ["diabetes", "blood sugar", "glucose", "diasuddhi", "gudmar", "methi", "shilajeet"],
    badges: ["50% OFF"],
    video: null,
    highlights: ["Herbal Formula", "Safe & Gentle", "No Additives", "Made in India"],
    faq: [
      { question: "What is Diasuddhi?", answer: "Diasuddhi is an Ayurvedic supplement formulated with traditional herbs to support metabolic wellness as part of a balanced lifestyle." },
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
    seoTitle: "Meenazo Diasuddhi | Ayurvedic Support for Metabolic Wellness | 30 Caps",
    seoDescription: "Diasuddhi by Meenazo is an Ayurvedic blend of Gudmar, Methi, Punarnava, Bael Fruit, Kalonji, Guggal & Shilajeet that supports everyday metabolic wellness, steady energy and mindful eating. 30 capsules.",
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
    shortDescription: "Ayurvedic support for stamina & strength · 60 capsules",
    description:
      "Today's fast-paced lifestyle, poor sleep, and constant stress can quietly take a toll on a man's everyday energy and stamina.\n\nJoshveda is a carefully crafted Ayurvedic formulation designed to support your body's natural energy and help you feel more like yourself through the day. It is made with some of the powerful Ayurvedic actives, including Shatavari, Ashwagandha, Safed Musli, Talmakhana, Vidhara, Salam Panja, and Samudra Shokh.\n\nThis formulation is designed to support natural energy levels, aid the body's recovery process, and promote a sense of everyday energy.\n\nFor best results, take one capsule of Joshveda twice a day, consistently, as part of your daily routine. With no added preservatives and a transparent, thoughtfully sourced ingredient list, Joshveda is created for men who want to support their wellness journey, naturally and steadily.",
    emoji: "💪",
    gradient: ["#eef2f7", "#e3ecf5"],
    images: ["/images/joshveda.png"],
    ingredients: [
      { name: "Shatavari", description: "A revered Ayurvedic herb, Shatavari has been traditionally used and studied for its role in supporting overall vitality and strength." },
      { name: "Ashwagandha", description: "One of Ayurveda's most valued herbs, Ashwagandha has been researched for its potential role in supporting stamina and the body's response to stress." },
      { name: "Safed Musli", description: "Known in Ayurveda as a strengthening herb, Safed Musli has been traditionally used to support physical vitality and everyday stamina." },
      { name: "Talmakhana", description: "Traditionally valued in Ayurveda, Talmakhana has been used to support overall wellness and everyday physical resilience." },
      { name: "Vidhara", description: "A lesser-known but valued Ayurvedic herb, Vidhara has been traditionally used to support strength and everyday physical wellness." },
      { name: "Salam Panja", description: "Salam Panja has been traditionally used in Ayurveda to support stamina and vitality." },
      { name: "Samudra Shokh", description: "A traditional Ayurvedic ingredient, Samudra Shokh has been valued for its role in supporting overall strength and physical wellness." },
    ],
    benefits: [
      "Helps with Energy Recovery",
      "Supports Daily Stamina",
      "Supports Natural Strength",
      "Supports Overall Energy",
    ],
    benefitsHeadline: "Gentle, Ayurvedic support for everyday stamina & vitality",
    benefitDetails: [
      { title: "Helps with energy recovery", description: "A balanced herbal formulation supports natural energy levels, helping you feel more active through the day." },
      { title: "Supports daily stamina", description: "This blend of traditional herbs supports your body's natural stamina, helping you keep pace with daily demands." },
      { title: "Supports natural strength", description: "Formulated to support the body's natural strength, contributing to an overall sense of physical wellbeing." },
      { title: "Supports overall energy", description: "Supports your body's natural vitality, helping you feel more like yourself, day after day." },
    ],
    howToUse:
      "Take one capsule with water after breakfast and one capsule with water after dinner, or as advised by your healthcare practitioner. Continue this routine daily for a steady wellness experience.",
    howToUseHeadline: "3 steps for the energized you",
    howToUseSteps: [
      { title: "Morning dose", description: "Take one capsule with water after breakfast daily." },
      { title: "Evening dose", description: "Take the second capsule with water after dinner daily." },
      { title: "Stay consistent", description: "Continue this routine daily for a steady wellness experience." },
    ],
    comparison: [
      { ours: "Ayurvedic ingredients", others: "Synthetic filler ingredients" },
      { ours: "No added preservatives", others: "Preservative-heavy formulations" },
      { ours: "Thoughtfully sourced formulation", others: "Unclear formulation origins" },
      { ours: "Lab-tested for quality", others: "Limited quality testing" },
    ],
    dosage: "2 capsules per day",
    rating: 4.0,
    reviewCount: 84,
    reviews: [
      { id: "josh1", productId: "14", author: "Rohit Sharma, 34", avatar: "", rating: 5, title: "My father-in-law recommended this", comment: "My father-in-law has been taking something similar for years and finally convinced me to try it. Two capsules a day isn't hard to remember, one after breakfast, one after dinner with the family.", date: "2026-05-27", verified: true },
      { id: "josh2", productId: "14", author: "Amit Kumar, 29", avatar: "", rating: 5, title: "Works well with my gym days", comment: "I train four times a week and wanted something to go with my routine, not against it. Been three weeks in and it's just... part of the day now, like brushing my teeth.", date: "2026-05-18", verified: true },
      { id: "josh3", productId: "14", author: "Suresh Pakheja, 41", avatar: "", rating: 4, title: "The smell took some getting used to", comment: "Not gonna lie, the capsule has that strong Ashwagandha smell when you open the bottle. Doesn't bother me anymore though. My wife jokes that our bathroom shelf smells like a herbal shop now.", date: "2026-05-09", verified: true },
      { id: "josh4", productId: "14", author: "Vikram Joshi, 37", avatar: "", rating: 5, title: "Easy to keep up with", comment: "I've tried a couple of these Ayurvedic things before and always forget to take them after a week. Somehow this one stuck, maybe because I keep it next to my toothbrush.", date: "2026-04-30", verified: true },
      { id: "josh5", productId: "14", author: "Nikhil Deewan, 45", avatar: "", rating: 5, title: "My cousin's suggestion", comment: "Wasn't expecting much honestly, my cousin just handed me a strip and said try it. Been over a month now and I haven't stopped, so that says something I guess.", date: "2026-04-21", verified: true },
      { id: "josh6", productId: "14", author: "Karan Malhotra, 32", avatar: "", rating: 5, title: "Good for my late-night shifts", comment: "I work rotating shifts so my routine is all over the place. This is one of the few things I've managed to keep consistent, twice a day, whenever those two meals happen to be.", date: "2026-04-12", verified: true },
      { id: "josh7", productId: "14", author: "Ajay Tomar, 39", avatar: "", rating: 4, title: "Capsules are easy, no complaints", comment: "Nothing dramatic to report, just a straightforward addition to my day. Easy to swallow, no aftertaste, comes in a bottle that doesn't take up much space on my desk.", date: "2026-04-03", verified: true },
      { id: "josh8", productId: "14", author: "Deepak Rai, 48", avatar: "", rating: 5, title: "Been on it since my checkup", comment: "Doctor mentioned I should look after my energy levels a bit more after my last checkup. A friend pointed me to this and it's been a manageable, natural addition alongside eating better.", date: "2026-03-25", verified: true },
      { id: "josh9", productId: "14", author: "Rahul Bisht, 27", avatar: "", rating: 5, title: "My evening ritual now", comment: "There's something nice about having a little routine, capsule after dinner, then I wind down for the night.", date: "2026-03-16", verified: true },
      { id: "josh10", productId: "14", author: "Priya Vinay, 43", avatar: "", rating: 5, title: "Bought it for my husband", comment: "I ordered this for my husband after seeing the ingredient list, recognised most of them from home remedies my mother used to make. He's been consistent for two months now, which is rare for him.", date: "2026-03-07", verified: true },
    ],
    stock: 100,
    unit: "60 capsules",
    variants: [
      { label: "1 Bottle · 60 capsules", unit: "60 capsules", price: 4598, salePrice: 2299 },
      { label: "2 Bottles · 120 capsules", unit: "120 capsules", price: 9196, salePrice: 3999 },
      { label: "3 Bottles · 180 capsules", unit: "180 capsules", price: 13794, salePrice: 5499 },
    ],
    tags: ["men's health", "stamina", "strength", "joshveda", "ashwagandha", "safed musli", "vitality"],
    badges: ["New", "50% OFF"],
    video: null,
    highlights: ["Herbal Formula", "Safe & Gentle", "No Additives", "Made in India"],
    faq: [
      { question: "What is Joshveda?", answer: "Joshveda is an Ayurvedic supplement formulated with traditional herbs to support everyday stamina and vitality as part of a balanced lifestyle." },
      { question: "What are the key ingredients in Joshveda?", answer: "Joshveda contains Shatavari, Ashwagandha, Safed Musli, Talmakhana, Vidhara, Salam Panja, and Samudra Shokh, all traditionally valued in Ayurveda." },
      { question: "How should I take Joshveda?", answer: "Take 1 capsule twice a day, or as advised by a healthcare professional, as part of a consistent routine." },
      { question: "Is Joshveda safe for daily use?", answer: "Joshveda is made from natural Ayurvedic ingredients and is intended for regular use. If you're on medication, please consult your doctor first." },
      { question: "Can I take Joshveda along with my regular medication?", answer: "We recommend consulting your healthcare provider before combining Joshveda with any other medication or supplement." },
      { question: "How long does it take to notice a difference?", answer: "Every individual's body responds differently. Consistent daily use, alongside a balanced diet, is recommended for the best experience." },
      { question: "Are there any side effects of Joshveda?", answer: "Joshveda is generally well tolerated. If you have allergies or existing health conditions, please consult your doctor before use." },
      { question: "Is Joshveda suitable for all age groups?", answer: "Joshveda is formulated for adult men. If you're under 18 or have specific health concerns, please consult your doctor before use." },
    ],
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: true,
    seoTitle: "Meenazo Joshveda | Ayurvedic Support for Stamina & Strength | 60 Caps",
    seoDescription: "Joshveda by Meenazo is an Ayurvedic blend of Shatavari, Ashwagandha, Safed Musli, Talmakhana, Vidhara, Salam Panja & Samudra Shokh that supports everyday stamina, strength and natural energy. 60 capsules.",
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
