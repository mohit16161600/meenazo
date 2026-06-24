import type { Category } from "@/types";
import { products } from "./products";

/**
 * Categories are fully dynamic — add unlimited entries here.
 * `productCount` is illustrative; the real count is derived from products.
 */
export const categories: Category[] = [
  {
    id: "cat-diabetes",
    name: "Diabetes Care",
    slug: "diabetes",
    emoji: "🩸",
    description: "Manage blood sugar naturally",
    longDescription:
      "Time-tested Ayurvedic herbs like Gymnema, Jamun and Karela that support healthy blood-sugar metabolism and insulin sensitivity.",
    gradient: ["#eaf3ee", "#dceee4"],
    productCount: 8,
    featured: true,
  },
  {
    id: "cat-weight-loss",
    name: "Weight Loss",
    slug: "weight-loss",
    emoji: "⚖️",
    description: "Healthy, sustainable metabolism",
    longDescription:
      "Holistic fat-metabolism support with Garcinia, Triphala and Green Coffee to help you reach a healthy weight the Ayurvedic way.",
    gradient: ["#f6efe8", "#f0e4d6"],
    productCount: 6,
    featured: true,
  },
  {
    id: "cat-mens-health",
    name: "Men's Health",
    slug: "mens-health",
    emoji: "💪",
    description: "Strength, stamina & vitality",
    longDescription:
      "Ashwagandha, Shilajit and Safed Musli blends formulated to support energy, stamina, and overall male vitality.",
    gradient: ["#eef2f7", "#e3ecf5"],
    productCount: 7,
    featured: true,
  },
  // {
  //   id: "cat-womens-health",
  //   name: "Women's Health",
  //   slug: "womens-health",
  //   emoji: "🌸",
  //   description: "Balance & holistic wellness",
  //   longDescription:
  //     "Shatavari and Ashoka based formulations crafted to support hormonal balance, energy and wellbeing through every life stage.",
  //   gradient: ["#f7eef4", "#f3e0ee"],
  //   productCount: 7,
  //   featured: true,
  // },
  // {
  //   id: "cat-blood-pressure",
  //   name: "Blood Pressure",
  //   slug: "blood-pressure",
  //   emoji: "❤️",
  //   description: "Support a healthy heart",
  //   longDescription:
  //     "Arjuna and Sarpagandha herbs traditionally used to support healthy blood pressure and cardiovascular function.",
  //   gradient: ["#fdeeee", "#f8dede"],
  //   productCount: 5,
  //   featured: true,
  // },
  // {
  //   id: "cat-thyroid",
  //   name: "Thyroid Care",
  //   slug: "thyroid",
  //   emoji: "🦋",
  //   description: "Balance thyroid function",
  //   longDescription:
  //     "Kanchnar Guggul and Ashwagandha formulations that support healthy thyroid function and metabolism.",
  //   gradient: ["#eef2f7", "#e3ecf5"],
  //   productCount: 4,
  //   featured: true,
  // },
  // {
  //   id: "cat-digestive-health",
  //   name: "Digestive Health",
  //   slug: "digestive-health",
  //   emoji: "🌱",
  //   description: "Gut health & easy digestion",
  //   longDescription:
  //     "Triphala, Ajwain and Hing formulations to support digestion, gut health and regular metabolism.",
  //   gradient: ["#eaf3ee", "#dceee4"],
  //   productCount: 9,
  //   featured: true,
  // },
  // {
  //   id: "cat-immunity",
  //   name: "Immunity",
  //   slug: "immunity",
  //   emoji: "🛡️",
  //   description: "Build natural defenses",
  //   longDescription:
  //     "Giloy, Tulsi and Amla rich blends to strengthen your body's natural immune response all year round.",
  //   gradient: ["#fef6e7", "#fbedd0"],
  //   productCount: 10,
  //   featured: true,
  // },
];

// Derive the real product count per category from the catalogue (keeps counts
// honest as products are added — the literal values above are just defaults).
for (const c of categories) {
  c.productCount = products.filter((p) => p.category === c.slug).length;
  c.image = c.image ?? `/images/categories/${c.slug}.svg`;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryProductCount(slug: string): number {
  return products.filter((p) => p.category === slug).length;
}

export const featuredCategories = categories.filter((c) => c.featured);
