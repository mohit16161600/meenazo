import type { FAQItem } from "@/types";
import genFaqs from "./generated/faqs.json";

/** Global FAQ used on the home FAQ section and /faq page. */
const fallbackGeneralFaq: FAQItem[] = [
  { question: "Are Meenazo products 100% authentic and safe?", answer: "Absolutely. Every product is manufactured in WHO-GMP and ISO certified facilities, formulated by qualified BAMS Ayurvedic doctors, and third-party lab tested for purity, potency and heavy metals." },
  { question: "How long does it take to see results?", answer: "Ayurveda works holistically, so results build gradually. Most customers notice benefits within 2–6 weeks of consistent daily use, depending on the product and individual constitution." },
  { question: "Can I take these alongside my prescription medicine?", answer: "Ayurvedic supplements are generally safe, but if you are on prescription medication, pregnant or nursing, we recommend consulting your physician before starting." },
  { question: "Are the products vegetarian?", answer: "Yes — the vast majority of our formulations are 100% vegetarian and use plant-based capsules. Each product page lists its specifics." },
  { question: "What is your return policy?", answer: "We offer a 30-day hassle-free return policy on unopened products. See our Return Policy page for full details." },
  { question: "How fast is delivery?", answer: "Orders are dispatched within 24–48 hours and typically delivered in 3–6 business days across India. Free shipping on orders over ₹499." },
  { question: "Do you offer Cash on Delivery?", answer: "Yes, COD is available across most pin codes in India, along with UPI, cards and Razorpay." },
  { question: "How should I store the products?", answer: "Store in a cool, dry place away from direct sunlight. Keep the lid tightly closed and out of reach of children." },
];

type GenFaq = { question: string; answer: string; sortOrder?: number };
export const generalFaq: FAQItem[] =
  Array.isArray(genFaqs) && (genFaqs as unknown[]).length
    ? (genFaqs as unknown as GenFaq[])
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((f) => ({ question: f.question, answer: f.answer }))
    : fallbackGeneralFaq;
