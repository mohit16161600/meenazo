import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { formatPrice } from "@/utils/format";
import { siteConfig } from "@/data/site";
import { codCooldownMinutes, codMaxOrderValue, formatWait } from "@/lib/codRules";

export const metadata: Metadata = buildMetadata({
  title: "Shipping Policy",
  description:
    "Everything you need to know about Meenazo shipping — processing times, rates, delivery timelines, tracking and Cash on Delivery.",
  path: "/shipping-policy",
});

/**
 * The COD paragraph mirrors the live rules (lib/codRules.ts) rather than
 * restating them by hand, so tightening a limit in the panel can't leave this
 * page promising something checkout refuses.
 */
const codBody: string[] = [
  "Cash on Delivery is available across most serviceable pin codes in India. COD availability is always shown at checkout. We also accept UPI, debit and credit cards, and Razorpay for prepaid orders.",
];
if (codMaxOrderValue(siteConfig) > 0) {
  codBody.push(
    `COD is offered on orders up to ${formatPrice(codMaxOrderValue(siteConfig))}. Orders above that amount can be placed with online payment only — which also earns you an instant prepaid discount.`
  );
}
if (codCooldownMinutes(siteConfig) > 0) {
  codBody.push(
    `To keep deliveries reliable, one mobile number can place a single COD order every ${formatWait(codCooldownMinutes(siteConfig))}. To order again straight away, please choose online payment.`
  );
}

const sections: LegalSection[] = [
  {
    heading: "1. Order Processing Time",
    body: "Orders are processed and dispatched within 24 to 48 hours of being placed (excluding Sundays and public holidays). Orders placed after 4:00 PM or on a weekend are processed on the next business day. We send your order confirmation on WhatsApp to the mobile number you signed in with, and message you again as soon as your order ships.",
  },
  {
    heading: "2. Shipping Rates",
    body: [
      `We offer FREE standard shipping on all orders over ${formatPrice(siteConfig.freeShippingThreshold)}.`,
      `For orders below ${formatPrice(siteConfig.freeShippingThreshold)}, a flat shipping charge of ${formatPrice(siteConfig.shippingCharge)} applies. The exact amount is always shown at checkout before you pay.`,
    ],
  },
  {
    heading: "3. Delivery Timelines",
    body: "Once dispatched, most orders are delivered within 3 to 6 business days, depending on your location. Metro cities typically receive deliveries faster than remote or rural pin codes. Please note that delivery times are estimates and may occasionally be affected by factors beyond our control, such as weather or courier delays.",
  },
  {
    heading: "4. Order Tracking",
    body: "As soon as your order is shipped, we'll send you the courier name, tracking number and a link to follow your package in real time. You can also view live status, the full tracking history and the courier link any time under 'My Orders' in your account.",
  },
  {
    heading: "5. Cash on Delivery (COD)",
    body: codBody,
  },
  {
    heading: "6. International Shipping",
    body: "At present, we ship only within India and do not offer international delivery. We're working hard to bring authentic Meenazo formulations to customers worldwide — please check back soon or subscribe to our newsletter for updates.",
  },
  {
    heading: "7. Need Help?",
    body: `If you have any questions about your shipment, please reach out to us at ${siteConfig.email} or ${siteConfig.phone} and our team will be happy to assist.`,
  },
];

export default function ShippingPolicyPage() {
  return <LegalPage title="Shipping Policy" lastUpdated="22 June 2026" sections={sections} />;
}
