import type { Benefit, BeforeAfter } from "@/types";

/**
 * `icon` fields below are semantic keys resolved to SVGs by <Icon name=… />.
 * (Unknown keys fall back to rendering the raw string, so emojis still work.)
 */

/** Feature bar under the hero. */
export const features: Benefit[] = [
  { icon: "truck", title: "Free Delivery", description: "On orders over ₹499" },
  { icon: "flask", title: "Lab Tested", description: "Third-party verified" },
  { icon: "return", title: "Easy Returns", description: "30-day return policy" },
  { icon: "headset", title: "Expert Support", description: "Ayurvedic advisors on call" },
];

/** "Why Choose Us" grid. */
export const whyChooseUs: Benefit[] = [
  { icon: "leaf", title: "100% Authentic Herbs", description: "Ethically sourced, traceable Ayurvedic herbs — made in India." },
  { icon: "microscope", title: "Clinically Backed", description: "Formulas built on standardised, research-backed herbal extracts." },
  { icon: "factory", title: "GMP Certified", description: "Manufactured in WHO-GMP and ISO certified facilities." },
  { icon: "flask", title: "Third-Party Tested", description: "Every batch lab-tested for purity, potency and heavy metals." },
  { icon: "sprout", title: "No Nasties", description: "No added sugar, fillers, artificial colours or preservatives." },
  { icon: "stethoscope", title: "Doctor Formulated", description: "Created with experienced Ayurvedic physicians." },
];

/** Ayurvedic philosophy / benefits section. */
export const ayurvedicBenefits: Benefit[] = [
  { icon: "scale", title: "Restore Balance", description: "Ayurveda works to balance your Vata, Pitta and Kapha doshas for holistic wellbeing." },
  { icon: "sun", title: "Treat the Root Cause", description: "Rather than masking symptoms, Ayurveda addresses the underlying imbalance." },
  { icon: "heart-pulse", title: "Gentle & Natural", description: "Plant-based formulations that work with your body, not against it." },
  { icon: "infinity", title: "Time-Tested", description: "A 5,000-year-old science of life, refined across millennia." },
];

export const beforeAfter: BeforeAfter[] = [
  { id: "ba1", name: "Anjali, 29", concern: "Weight & digestion", duration: "10 weeks", beforeEmoji: "😕", afterEmoji: "😊", result: "Lighter digestion & controlled appetite with Slimpax", product: "slimpax" },
  { id: "ba2", name: "Rajesh, 47", concern: "Blood sugar management", duration: "12 weeks", beforeEmoji: "😟", afterEmoji: "🙂", result: "More stable readings alongside diet with Diasuddhi", product: "diasuddhi" },
  { id: "ba3", name: "Vikram, 34", concern: "Low energy & stamina", duration: "8 weeks", beforeEmoji: "😩", afterEmoji: "😄", result: "Sustained energy & better focus with Joshveda", product: "joshveda" },
];

// Attach branded dummy before/after images (matches id-named files).
for (const b of beforeAfter) {
  b.beforeImage = b.beforeImage ?? `/images/before-after/${b.id}-before.svg`;
  b.afterImage = b.afterImage ?? `/images/before-after/${b.id}-after.svg`;
}
