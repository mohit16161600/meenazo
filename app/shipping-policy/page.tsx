import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { formatPrice } from "@/utils/format";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Shipping Policy",
  description:
    "Everything you need to know about Meenazo shipping — processing times, rates, delivery timelines, tracking and Cash on Delivery.",
  path: "/shipping-policy",
});

const sections: LegalSection[] = [
  {
    heading: "1. Order Processing Time",
    body: "Orders are processed and dispatched within 24 to 48 hours of being placed (excluding Sundays and public holidays). Orders placed after 4:00 PM or on a weekend are processed on the next business day. You will receive a confirmation email as soon as your order ships.",
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
    body: "As soon as your order is shipped, we'll email you a tracking number and a link to follow your package in real time. You can also view your order status and tracking details anytime under the 'My Orders' section of your account.",
  },
  {
    heading: "5. Cash on Delivery (COD)",
    body: "Cash on Delivery is available across most serviceable pin codes in India. COD availability is automatically shown at checkout based on your delivery address. We also accept UPI, debit and credit cards, and Razorpay for prepaid orders.",
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
