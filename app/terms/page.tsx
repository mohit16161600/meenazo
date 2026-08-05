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

const intro =
  "BY PLACING AN ORDER THROUGH THIS WEBSITE, YOU AGREE TO THE TERMS AND CONDITIONS SET FORTH BELOW. PLEASE READ THROUGH THESE TERMS CAREFULLY BEFORE PLACING YOUR ORDER. PLEASE ALSO READ OUR PRIVACY POLICY REGARDING PERSONAL INFORMATION PROVIDED BY YOU, WHICH IS INCORPORATED HEREIN BY REFERENCE.";

const freeShipping = `${siteConfig.currencySymbol}${siteConfig.freeShippingThreshold}`;

/** Supplied verbatim by the company; placeholders filled from data/site.ts. */
const sections: LegalSection[] = [
  {
    heading: "1. About the Company",
    body: [
      "1.1. Meenazo Private Limited (hereinafter referred to as “We/Our/Company”) is a company incorporated and registered under the Companies Act, 2013, having registered office address at E-44/10, Pocket D, Okhla Phase II, New Delhi, Delhi 110020.",
      "1.2. These Terms & Conditions (hereinafter referred to as the “Terms”) govern your use of the Website and your purchase of products from Meenazo Private Limited. By accessing the Website and placing an order, you agree to be bound by these Terms.",
    ],
  },
  {
    heading: "2. Definitions",
    body: [
      "2.1. “Agreement” means these Terms & Conditions, the Privacy Policy, and any other policies referenced herein.",
      "2.2. “Customer/You/Your” means any individual or entity who accesses the Website and places an order for products.",
      "2.3. “Products” means the Ayurvedic nutraceutical supplements and wellness products offered for sale on the Website.",
      "2.4. “Services” means the sale and delivery of Products through the Website, along with any related customer support and wellness consultation services.",
      "2.5. “Website” means the online platform operated by Meenazo Private Limited at www.meenazo.com.",
    ],
  },
  {
    heading: "3. Acceptance of Terms",
    body: [
      "3.1. By using the Website and placing an order, you acknowledge that you have read, understood, and agree to be bound by these Terms.",
      "3.2. If you do not agree to these Terms, you must not use the Website or place any orders.",
      "3.3. We reserve the right to update, modify, or revise these Terms at any time without prior notice. The updated Terms will be effective immediately upon posting on the Website. Your continued use of the Website following any changes constitutes your acceptance of the revised Terms.",
    ],
  },
  {
    heading: "4. Eligibility",
    body: [
      "4.1. You must be at least 18 years of age to use the Website and place orders.",
      "4.2. By placing an order, you represent and warrant that you are legally competent to enter into a binding contract.",
      "4.3. You agree to provide accurate, current, and complete information during the registration and ordering process.",
    ],
  },
  {
    heading: "5. Products and Services",
    body: [
      "5.1. Our Products are Ayurvedic dietary supplements designed to support wellness and are not intended to diagnose, treat, cure, or prevent any disease.",
      "5.2. We blend Ayurvedic wisdom with modern science to formulate our Products. However, individual results may vary based on body composition, lifestyle, and adherence to usage instructions.",
      "5.3. We reserve the right to discontinue any Product at any time without prior notice.",
      "5.4. All Product descriptions, images, and specifications on the Website are for informational purposes only and may not be entirely accurate or up-to-date.",
    ],
  },
  {
    heading: "6. Medical Disclaimer",
    body: [
      "6.1. IMPORTANT: The information provided on this Website, including Product descriptions, blog posts, and wellness recommendations, is for general informational and educational purposes only.",
      "6.2. Our Products are food supplements and not a substitute for a balanced diet or professional medical treatment.",
      "6.3. You must consult your physician or other qualified healthcare provider before using any Meenazo Product, especially if you:",
      {
        list: [
          "Are pregnant or nursing",
          "Have any pre-existing medical condition (e.g., diabetes, heart disease, liver/kidney disorders)",
          "Are taking any prescription medications",
          "Are under 18 years of age",
        ],
      },
      "6.4. Never disregard professional medical advice or delay in seeking it because of something you have read on this Website.",
      "6.5. The statements made regarding our Products have not been evaluated by the Food Safety and Standards Authority of India (FSSAI) unless expressly stated otherwise.",
    ],
  },
  {
    heading: "7. Pricing and Payment",
    body: [
      "7.1. All prices listed on the Website are in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.",
      "7.2. We reserve the right to modify prices at any time without prior notice. However, the price applicable to your order will be the price displayed at the time of placing the order.",
      "7.3. In the event of a pricing error, we reserve the right to cancel or refuse orders placed at the incorrect price. We will notify you and offer you the option to proceed with the order at the corrected price or cancel it for a full refund.",
      "7.4. Payment must be made in full at the time of placing the order. We accept payments through secure third-party payment gateways, including but not limited to credit/debit cards, UPI, net banking, and digital wallets.",
      "7.5. We do not store your complete payment credentials. All payment processing is handled by our PCI-DSS compliant payment partners.",
    ],
  },
  {
    heading: "8. Order Acceptance and Fulfillment",
    body: [
      "8.1. Receipt of an order confirmation message does not constitute acceptance of your order. We reserve the right to accept or decline your order for any reason, including but not limited to product unavailability, suspicion of fraud, or inability to verify payment details.",
      "8.2. Order confirmations and shipping updates are sent to the mobile number you registered with, over WhatsApp. Tracking details are also available at all times under 'My Orders' in your account.",
      "8.3. We reserve the right to limit the quantity of Products ordered per customer or per address.",
    ],
  },
  {
    heading: "9. Shipping and Delivery",
    body: [
      "9.1. Geographic Scope: We currently sell and ship our Products exclusively within India. We do not process international orders at this time.",
      "9.2. Processing Time: Orders are processed within 1-2 business days (excluding weekends and public holidays).",
      "9.3. Delivery Time: Estimated delivery time is 3-7 business days depending on your pincode. Express delivery options, if available, may take 1-3 business days.",
      `9.4. Shipping Charges: We offer free shipping on orders above ${freeShipping}. For orders below this threshold, standard shipping charges will apply and be displayed at checkout.`,
      "9.5. Delays: Delivery times are estimates and may be delayed due to unforeseen circumstances such as weather conditions, courier disruptions, public holidays, or government restrictions. We shall not be liable for such delays.",
    ],
  },
  {
    heading: "10. Cancellation Policy",
    body: [
      `10.1. By Customer: You may cancel your order before it is shipped (i.e., within 6 hours of placing the order). To cancel, contact us at ${siteConfig.email} or call ${siteConfig.phone} with your Order ID.`,
      "10.2. By Company: We reserve the right to cancel your order if:",
      {
        list: [
          "The Product is out of stock.",
          "We detect suspicious or fraudulent activity.",
          "There is an error in pricing or Product description.",
          "We are unable to verify your shipping or billing information.",
        ],
      },
      "10.3. Refund for Cancellations: Since Meenazo operates on a “Replacement Only” policy, cancellations (whether initiated by you or us) will result in a full store credit/voucher equivalent to the amount paid, which you can use for future purchases on our Website.",
    ],
  },
  {
    heading: "11. Intellectual Property",
    body: [
      "11.1. All content on the Website, including but not limited to text, graphics, logos, icons, images, audio clips, video clips, data compilations, and software, is the exclusive property of Meenazo Private Limited and is protected by Indian and international copyright laws.",
      "11.2. You may not reproduce, distribute, modify, display, perform, publish, or create derivative works from any content on the Website without our prior written consent.",
      "11.3. The trademarks, service marks, and trade names displayed on the Website are the registered and unregistered trademarks of Meenazo Private Limited.",
    ],
  },
  {
    heading: "12. User Accounts and Responsibilities",
    body: [
      "12.1. To place an order, you may be required to create an account on the Website. You are responsible for maintaining the confidentiality of your account credentials.",
      "12.2. You agree to notify us immediately of any unauthorized use of your account.",
      "12.3. You are solely responsible for all activities that occur under your account.",
      "12.4. You agree not to use the Website for any unlawful or prohibited purpose, including but not limited to:",
      {
        list: [
          "Transmitting viruses or malicious code.",
          "Violating the rights of others.",
          "Engaging in fraudulent activities.",
        ],
      },
    ],
  },
  {
    heading: "13. Prohibited Activities",
    body: [
      "You agree not to:",
      {
        list: [
          "Use the Website in any manner that could disable, overburden, or impair the Website.",
          "Attempt to gain unauthorized access to the Website, user accounts, or computer systems.",
          "Use any robot, spider, or other automated device to access the Website for any purpose.",
          "Interfere with the proper working of the Website.",
          "Engage in any activity that violates applicable laws or regulations.",
        ],
      },
    ],
  },
  {
    heading: "14. Limitation of Liability",
    body: [
      "14.1. To the fullest extent permitted by applicable law, Meenazo Private Limited, its directors, employees, affiliates, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or related to:",
      {
        list: [
          "The use or inability to use the Website.",
          "The purchase, use, or consumption of our Products.",
          "Any errors, omissions, or inaccuracies in the content on the Website.",
        ],
      },
      "14.2. Our total liability to you for any claim arising from these Terms or your use of the Website shall not exceed the total amount paid by you for the Products in the last 12 months.",
      "14.3. Nothing in these Terms limits or excludes our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded under Indian law.",
    ],
  },
  {
    heading: "15. Disclaimer of Warranties",
    body: [
      "15.1. The Website and Products are provided on an “as is” and “as available” basis without any warranties, express or implied.",
      "15.2. We do not warrant that:",
      {
        list: [
          "The Website will be uninterrupted, secure, or error-free.",
          "The results obtained from using the Website or Products will be accurate or reliable.",
          "The quality of any Products, Services, or information obtained through the Website will meet your expectations.",
        ],
      },
      "15.3. We disclaim all implied warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.",
    ],
  },
  {
    heading: "16. Indemnification",
    body: [
      "You agree to indemnify, defend, and hold harmless Meenazo Private Limited, its directors, employees, affiliates, and agents from and against any and all claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or related to:",
      {
        list: [
          "Your breach of these Terms.",
          "Your use of the Website.",
          "Your violation of any applicable laws or regulations.",
          "Your infringement of any third-party rights.",
        ],
      },
    ],
  },
  {
    heading: "17. Governing Law and Jurisdiction",
    body: [
      "17.1. These Terms and any disputes arising out of or related to them shall be governed by and construed in accordance with the laws of India.",
      "17.2. Any legal action or proceeding arising out of or related to these Terms or your use of the Website shall be subject to the exclusive jurisdiction of the courts in New Delhi.",
    ],
  },
  {
    heading: "18. Severability",
    body: "If any provision of these Terms is held to be invalid, illegal, or unenforceable under any applicable law, such provision shall be deemed modified to the minimum extent necessary to make it valid, legal, and enforceable, and the remaining provisions shall continue in full force and effect.",
  },
  {
    heading: "19. Waiver",
    body: "No failure or delay by Meenazo Private Limited in exercising any right, power, or remedy under these Terms shall operate as a waiver thereof, nor shall any single or partial exercise thereof preclude any other or further exercise thereof.",
  },
  {
    heading: "20. Entire Agreement",
    body: "These Terms, together with the Privacy Policy, Return & Replacement Policy, Shipping & Cancellation Policy, and Disclaimer, constitute the entire agreement between you and Meenazo Private Limited regarding your use of the Website and purchase of Products, superseding any prior agreements or understandings.",
  },
  {
    heading: "21. Contact Us",
    body: [
      "For any questions, concerns, or requests regarding these Terms & Conditions, please reach out to us:",
      "Meenazo Private Limited",
      "E-44/10, Pocket D, Okhla Phase II, New Delhi, Delhi 110020",
      `Email: ${siteConfig.email}`,
      `Phone: ${siteConfig.phone}`,
    ],
  },
  {
    heading: "22. Consent Acknowledgment",
    body: "By placing an order through this Website, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions, including the Privacy Policy and all other policies referenced herein.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated="3 August 2026"
      intro={intro}
      sections={sections}
    />
  );
}
