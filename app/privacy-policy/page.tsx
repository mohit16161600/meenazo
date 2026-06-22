import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Meenazo collects, uses and protects your personal information. Your privacy and trust matter to us.",
  path: "/privacy-policy",
});

const sections: LegalSection[] = [
  {
    heading: "1. Introduction",
    body: `At ${siteConfig.name}, your privacy is fundamental to the trust you place in us. This Privacy Policy explains what information we collect when you visit our website or place an order, how we use it, and the choices you have. By using our site, you consent to the practices described here.`,
  },
  {
    heading: "2. Information We Collect",
    body: [
      "We collect information you provide directly to us, such as your name, email address, phone number, shipping and billing address, and payment details when you create an account, place an order, or contact our support team.",
      "We also automatically collect certain technical information when you browse our site — including your IP address, device and browser type, pages visited, and the date and time of your visit — to help us improve your experience.",
    ],
  },
  {
    heading: "3. How We Use Your Information",
    body: [
      "We use your information to process and deliver your orders, send order confirmations and shipping updates, respond to your enquiries, and provide customer support.",
      "With your consent, we may use your details to send you wellness tips, product recommendations and promotional offers. You can opt out of marketing communications at any time using the unsubscribe link in any email.",
      "We may also use aggregated, anonymised data to analyse trends and improve our products and website.",
    ],
  },
  {
    heading: "4. Cookies & Tracking",
    body: [
      "We use cookies and similar technologies to keep items in your cart, remember your preferences, and understand how our site is used. Some cookies are essential for the site to function, while others help us improve performance and personalise content.",
      "You can control or disable cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of the site, such as the shopping cart.",
    ],
  },
  {
    heading: "5. Data Security",
    body: "We take the security of your data seriously. Payment transactions are encrypted using industry-standard SSL technology, and we never store your full card details on our servers. While no method of transmission over the internet is completely secure, we apply reasonable technical and organisational safeguards to protect your personal information.",
  },
  {
    heading: "6. Third-Party Services",
    body: [
      "We share your information only with trusted partners who help us operate our business — such as payment gateways, logistics and courier providers, and email service providers — and only to the extent necessary to provide their services.",
      "These partners are obligated to keep your information confidential and to use it solely for the purposes we specify. We do not sell or rent your personal data to any third party.",
    ],
  },
  {
    heading: "7. Your Rights",
    body: "You have the right to access, correct, update or request deletion of your personal information at any time. You may also object to certain processing or withdraw consent for marketing communications. To exercise any of these rights, please contact us using the details below and we will respond promptly.",
  },
  {
    heading: "8. Contact Us",
    body: `If you have any questions about this Privacy Policy or how we handle your data, please email us at ${siteConfig.email} or call ${siteConfig.phone}. You can also write to us at ${siteConfig.address}.`,
  },
];

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" lastUpdated="22 June 2026" sections={sections} />;
}
