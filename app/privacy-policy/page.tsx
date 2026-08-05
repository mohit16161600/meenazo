import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Meenazo collects, uses, shares and protects your personal information, and how you can exercise your rights over it.",
  path: "/privacy-policy",
});

/**
 * Supplied verbatim by the company. The only editorial change is the section
 * numbering: the source document restarted at "1" halfway through, so the
 * sections are numbered straight through 1-12 here.
 */
const sections: LegalSection[] = [
  {
    heading: "1. About this Policy",
    body: [
      "1.1. Meenazo Private Limited (hereinafter referred to as “We/Our/Company”) is a company incorporated and registered under the Companies Act, 2013, with its registered office at E-44/10, Pocket D, Okhla Phase II, New Delhi, Delhi 110020.",
      "1.2. The Company has developed the website www.meenazo.com (hereinafter referred to as the “Website”) for the purpose of selling Ayurvedic healthcare products that blend ancient Ayurvedic wisdom with modern science.",
      "1.3. This Policy serves as a Privacy Notice for the Website and the Services as defined herein in this Policy. It underlines how we process your personal information, including any health-related data you choose to share with us for personalised product recommendations, and how you can exercise your rights regarding the same.",
      "1.4. By using our Website and providing your personal information, you consent to the collection, storage, processing, and transfer of your information in accordance with this Privacy Policy. If you do not agree with this Policy, please do not use our Website or Services.",
    ],
  },
  {
    heading: "2. Information We Collect",
    body: [
      "We may collect the following types of information from you:",
      {
        list: [
          "Personal information such as your name, phone number, email address, billing address, shipping address, and other contact details.",
          "Order information such as products purchased, order history, transaction details, and delivery preferences.",
          "Payment information such as payment method details, transaction status, and payment confirmation. Please note that sensitive payment details are usually processed by secure third-party payment gateways and are not stored by us directly.",
          "Technical information such as IP address, browser type, device type, operating system, pages visited, and website usage data.",
          "Communication information such as messages, reviews, feedback, support requests, and other interactions with our team.",
        ],
      },
    ],
  },
  {
    heading: "3. How We Use Your Information",
    body: [
      "We use your information for the following purposes:",
      {
        list: [
          "To process and deliver your orders.",
          "To communicate with you about your order status, shipping updates, and service-related matters.",
          "To respond to your inquiries, complaints, or support requests.",
          "To improve our website, products, services, and customer experience.",
          "To personalize content, offers, and recommendations where applicable.",
          "To prevent fraud, misuse, unauthorized transactions, or illegal activity.",
          "To comply with applicable legal, regulatory, taxation, and accounting obligations.",
        ],
      },
    ],
  },
  {
    heading: "4. How We Share Information",
    body: [
      "We do not sell, rent, or trade your personal information to third parties for marketing purposes.",
      "However, we may share limited information with trusted third parties only when necessary for business operations, including:",
      {
        list: [
          "Payment gateways for secure payment processing.",
          "Courier and logistics partners for delivery of your orders.",
          "Technology and hosting providers for website operations and data storage.",
          "Analytics providers to help us understand website performance and user behavior.",
          "Legal or regulatory authorities when required by law, court order, or government request.",
        ],
      },
      "These third parties are expected to use your information only for the specific purpose for which it was shared and are expected to maintain confidentiality and security.",
    ],
  },
  {
    heading: "5. Cookies and Tracking Technologies",
    body: [
      "Our website may use cookies and similar technologies to improve your browsing experience. Cookies help us:",
      {
        list: [
          "Remember your preferences.",
          "Understand how users interact with the website.",
          "Improve page performance and website functionality.",
          "Show relevant content and offers.",
        ],
      },
      "You may choose to disable cookies in your browser settings. However, some parts of the website may not work properly if cookies are disabled.",
    ],
  },
  {
    heading: "6. Data Security",
    body: [
      "We use reasonable physical, technical, and administrative measures to protect your personal information from unauthorized access, misuse, disclosure, alteration, or destruction.",
      "While we strive to protect your data, no method of online transmission or electronic storage is completely secure. Therefore, we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "7. Data Retention",
    body: [
      "We keep your information only for as long as needed to:",
      {
        list: [
          "Fulfill the purpose for which it was collected.",
          "Complete transactions and provide customer support.",
          "Comply with legal and regulatory obligations.",
          "Resolve disputes and enforce agreements.",
        ],
      },
      "When your information is no longer required, we may delete or anonymize it in accordance with our internal practices and applicable law.",
    ],
  },
  {
    heading: "8. Your Rights",
    body: [
      "Subject to applicable law, you may have the right to:",
      {
        list: [
          "Access the personal information we hold about you.",
          "Request correction of inaccurate or incomplete information.",
          "Request deletion of your data, where legally permitted.",
          "Withdraw consent for certain types of processing.",
          "Contact us with concerns about how your information is being handled.",
        ],
      },
      `To exercise these rights, please contact us at ${siteConfig.email}.`,
    ],
  },
  {
    heading: "9. Third-Party Links",
    body: "Our website may contain links to third-party websites or services. These websites are governed by their own privacy policies. Meenazo is not responsible for the privacy practices, content, or security of such external websites.",
  },
  {
    heading: "10. Children’s Privacy",
    body: "Our website and products are not intended for children under 18 years of age without supervision of a parent or guardian. We do not knowingly collect personal information from children. If we become aware that such data has been collected, we will take appropriate steps to delete it.",
  },
  {
    heading: "11. Changes to This Privacy Policy",
    body: "We may update this Privacy Policy from time to time to reflect changes in our business, legal obligations, or website practices. The updated version will be posted on this page with a revised effective date.",
  },
  {
    heading: "12. Contact Us",
    body: [
      "If you have any questions about this Privacy Policy or how we handle your information, please contact us:",
      "Meenazo Pvt. Ltd.",
      siteConfig.address,
      `Email: ${siteConfig.email}`,
      `Phone: ${siteConfig.phone}`,
    ],
  },
];

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" lastUpdated="3 August 2026" sections={sections} />;
}
