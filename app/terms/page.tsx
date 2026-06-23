import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description:
    "The terms and conditions governing your use of the Meenazo website and the purchase of our Ayurvedic products.",
  path: "/terms",
});

const sections: LegalSection[] = [
  {
    heading: "1. Acceptance of Terms",
    body: `Welcome to ${siteConfig.name}. By accessing or using our website and placing an order, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please refrain from using our site.`,
  },
  {
    heading: "2. Use of the Site",
    body: [
      "You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of, or restrict the use and enjoyment of, this site by any third party.",
      "You must be at least 18 years of age, or accessing the site under the supervision of a parent or guardian, to make a purchase. You are responsible for maintaining the confidentiality of your account and password.",
    ],
  },
  {
    heading: "3. Orders & Pricing",
    body: [
      "All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order, including in cases of suspected fraud, pricing errors, or stock unavailability.",
      "Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. We make every effort to ensure pricing is accurate; however, in the event of an obvious error, we reserve the right to cancel the affected order and refund any amount paid.",
    ],
  },
  {
    heading: "4. Intellectual Property",
    body: `All content on this site — including text, graphics, logos, product descriptions, images and software — is the property of ${siteConfig.name} or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute or exploit any content without our prior written permission.`,
  },
  {
    heading: "5. Product Information",
    body: "We strive to describe our products as accurately as possible. However, the information provided is for general guidance and is not a substitute for professional medical advice. Ayurvedic products are not intended to diagnose, treat, cure or prevent any disease. Please refer to our Disclaimer for full details.",
  },
  {
    heading: "6. Limitation of Liability",
    body: `To the fullest extent permitted by law, ${siteConfig.name} shall not be liable for any indirect, incidental or consequential damages arising from the use of, or inability to use, our website or products. Our total liability for any claim shall not exceed the amount you paid for the product in question.`,
  },
  {
    heading: "7. Governing Law",
    body: "These Terms & Conditions are governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts of New Delhi, Delhi.",
  },
  {
    heading: "8. Contact Us",
    body: `If you have any questions about these Terms & Conditions, please contact us at ${siteConfig.email} or ${siteConfig.phone}.`,
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" lastUpdated="22 June 2026" sections={sections} />;
}
