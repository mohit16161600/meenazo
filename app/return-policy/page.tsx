import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Return & Refund Policy",
  description:
    "Meenazo's hassle-free 30-day return policy — eligibility, the return process, refund timelines and how we handle damaged or wrong items.",
  path: "/return-policy",
});

const sections: LegalSection[] = [
  {
    heading: "1. 30-Day Return Window",
    body: `Your satisfaction is our priority. If you're not completely happy with your purchase, you may return eligible items within 30 days of delivery for a refund. We want you to shop with complete confidence at ${siteConfig.name}.`,
  },
  {
    heading: "2. Eligibility",
    body: [
      "To be eligible for a return, items must be unopened, unused and in their original, sealed packaging with all tags and seals intact.",
      "For hygiene and safety reasons, we cannot accept returns of products whose seal has been broken or that have been partially used, unless the item arrived damaged or defective.",
    ],
  },
  {
    heading: "3. How to Initiate a Return",
    body: [
      "To start a return, contact our support team with your order number and the reason for the return. We'll review your request and, once approved, share the return instructions.",
      "Pack the item securely in its original packaging and hand it to our courier partner at the scheduled pickup, or ship it to the address we provide.",
    ],
  },
  {
    heading: "4. Refund Timelines",
    body: "Once we receive and inspect your returned item, we'll notify you of the outcome. Approved refunds are processed to your original payment method within 5 to 7 business days. For Cash on Delivery orders, refunds are issued via bank transfer or UPI once your bank details are confirmed.",
  },
  {
    heading: "5. Damaged or Wrong Items",
    body: "If you receive a damaged, defective or incorrect product, please contact us within 48 hours of delivery with photographs of the item and packaging. We'll arrange a free replacement or a full refund — including any shipping charges — at no cost to you.",
  },
  {
    heading: "6. Non-Returnable Items",
    body: "For health and safety reasons, opened or used products, items marked as final sale or clearance, and free promotional gifts are not eligible for return or refund unless they are faulty.",
  },
  {
    heading: "7. Contact Us",
    body: `For any return or refund queries, reach our team at ${siteConfig.email} or ${siteConfig.phone}. We're here to make things right.`,
  },
];

export default function ReturnPolicyPage() {
  return <LegalPage title="Return & Refund Policy" lastUpdated="22 June 2026" sections={sections} />;
}
