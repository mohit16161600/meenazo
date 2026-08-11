import type { FAQItem } from "@/types";
import genFaqs from "./generated/faqs.json";

/** Global FAQ used on the home FAQ section and /faq page. */
const fallbackGeneralFaq: FAQItem[] = [
  { question: "Are Meenazo products 100% authentic and safe?", answer: "Absolutely. Every product is manufactured in WHO-GMP and ISO certified facilities, formulated by qualified BAMS Ayurvedic doctors, and third-party lab tested for purity, potency and heavy metals." },
  { question: "How long does it take to see results?", answer: "Ayurveda works holistically, so results build gradually. Most customers notice benefits within 2–6 weeks of consistent daily use, depending on the product and individual constitution." },
  { question: "Can I take these alongside my prescription medicine?", answer: "Ayurvedic supplements are generally safe, but if you are on prescription medication, pregnant or nursing, we recommend consulting your physician before starting." },
  { question: "Are the products vegetarian?", answer: "Yes — the vast majority of our formulations are 100% vegetarian and use plant-based capsules. Each product page lists its specifics." },
  { question: "What is your return policy?", answer: "Returns and exchanges are accepted within 5 calendar days of delivery, only for a wrong product delivered, damage in transit, or a manufacturing defect — and only where the product is unopened, unused and supported by a continuous unboxing video. See our Return, Exchange & Refund Policy for the full conditions." },
  { question: "How fast is delivery?", answer: "We ship only within India, using ground-based courier partners. Estimated delivery is 7–10 business days from the date of dispatch, depending on your location and the serviceability of your PIN code. Timelines are estimates and may vary due to courier delays, weather or other factors beyond our control." },
  { question: "Do you offer Cash on Delivery?", answer: "Yes, COD is available across most pin codes in India, along with UPI, cards and Razorpay. COD applies to orders up to ₹4,000 (higher-value orders are prepaid only), and one mobile number can place one COD order per hour — see our Shipping Policy for details." },
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
