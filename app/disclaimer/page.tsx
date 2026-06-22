import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Disclaimer",
  description:
    "Important health and product information about Meenazo's Ayurvedic formulations. Please read before use.",
  path: "/disclaimer",
});

const sections: LegalSection[] = [
  {
    heading: "1. General Disclaimer",
    body: `The information and products provided by ${siteConfig.name} are for general wellness and educational purposes only. They are not intended to be a substitute for professional medical advice, diagnosis or treatment. Always seek the guidance of a qualified healthcare provider with any questions you may have regarding a medical condition.`,
  },
  {
    heading: "2. Not Evaluated by Regulatory Authorities",
    body: "The statements made about our products have not been evaluated by the FDA, the Ministry of AYUSH, or any other regulatory authority. Our products are sold as Ayurvedic wellness formulations and dietary supplements, and are not approved to diagnose, treat, cure or prevent any disease.",
  },
  {
    heading: "3. Not Intended to Diagnose or Treat",
    body: "Our Ayurvedic products are designed to support general wellbeing as part of a balanced lifestyle. They are not medicines and should not be used in place of any treatment prescribed by your doctor. Do not discontinue any prescribed medication without consulting your physician.",
  },
  {
    heading: "4. Consult Your Physician",
    body: "If you are pregnant, nursing, taking prescription medication, have a known medical condition, or are scheduled for surgery, please consult your physician before using any of our products. The same applies before giving any product to children or elderly individuals.",
  },
  {
    heading: "5. Individual Results May Vary",
    body: "Ayurveda works holistically and gradually. Results differ from person to person based on individual constitution (prakriti), lifestyle, diet and consistency of use. Any testimonials or examples shared reflect individual experiences and are not a guarantee of specific outcomes.",
  },
  {
    heading: "6. Allergen & Ingredient Notice",
    body: "Our formulations are made from natural herbs and botanicals. Please read the ingredient list on each product carefully before use. If you are allergic or sensitive to any listed ingredient, discontinue use immediately. Should you experience any adverse reaction, stop use and consult a healthcare professional.",
  },
  {
    heading: "7. Questions",
    body: `If you have any questions about a product or its suitability for you, please contact us at ${siteConfig.email} or ${siteConfig.phone} before use. Your safety always comes first.`,
  },
];

export default function DisclaimerPage() {
  return <LegalPage title="Disclaimer" lastUpdated="22 June 2026" sections={sections} />;
}
