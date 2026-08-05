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

const intro =
  "The information on the Meenazo website is provided for general informational and educational purposes only. It should not be treated as medical advice, diagnosis, or treatment.";

/** Supplied verbatim by the company. */
const sections: LegalSection[] = [
  {
    heading: "1. Not a Substitute for Medical Advice",
    body: [
      "Meenazo products are created to support wellness and may be based on Ayurvedic and nutraceutical principles. However, they are not a substitute for professional medical guidance.",
      "You should always consult a qualified doctor or healthcare professional before using any product, especially if you:",
      {
        list: [
          "Have a medical condition.",
          "Are pregnant or breastfeeding.",
          "Are taking prescription medication.",
          "Have a history of allergies or sensitivities.",
          "Are using the product for children or elderly individuals.",
        ],
      },
    ],
  },
  {
    heading: "2. No Disease Cure Claims",
    body: "Unless specifically permitted by law and clearly stated on the product label, our products are not intended to diagnose, treat, cure, or prevent any disease. Any health-related content on the website is meant only to support general wellness awareness.",
  },
  {
    heading: "3. Individual Results May Vary",
    body: "Results may vary from person to person depending on several factors such as age, health condition, diet, sleep, exercise, stress levels, and consistency of use. Meenazo does not guarantee identical results for every user.",
  },
  {
    heading: "4. Product Use Instructions",
    body: [
      "Please read the product label, ingredients list, directions for use, warnings, and precautions carefully before consumption. Use the product only as directed.",
      "If you experience any side effects, discomfort, or allergic reaction, stop using the product immediately and consult a healthcare professional.",
    ],
  },
  {
    heading: "5. No Warranty",
    body: "All content on this website is provided on an “as is” and “as available” basis. We make no warranties, express or implied, regarding the completeness, reliability, suitability, or accuracy of the information provided.",
  },
  {
    heading: "6. External Links and Third Parties",
    body: "Our website may contain links to third-party websites or references to third-party content. These are provided for convenience only. Meenazo is not responsible for the availability, content, or policies of such external websites.",
  },
  {
    heading: "7. Responsibility of the User",
    body: "By using our website and products, you accept responsibility for making your own informed decisions. You should not rely solely on website content when making health-related choices.",
  },
  {
    heading: "8. Contact",
    body: [
      "For questions regarding this disclaimer, please contact:",
      "Meenazo Pvt. Ltd.",
      siteConfig.address,
      `Email: ${siteConfig.email}`,
      `Phone: ${siteConfig.phone}`,
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      lastUpdated="3 August 2026"
      intro={intro}
      sections={sections}
    />
  );
}
