import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Shipping & Cancellation Policy",
  description:
    "How Meenazo ships your order — coverage, delivery timelines, COD eligibility, tracking — and how orders may be cancelled and refunded.",
  path: "/shipping-policy",
});

const intro =
  "This Shipping & Cancellation Policy applies to all orders placed on www.meenazo.com (the “Website”) and forms part of, and must be read together with, our Terms of Use and our Return, Exchange & Refund Policy. In this Policy, “we”, “us”, and “Meenazo” refer to Meenazo Private Limited, and “you” refers to the customer placing the order.";

/** Supplied verbatim by the company — do not paraphrase or re-order clauses. */
const sections: LegalSection[] = [
  {
    heading: "1.1 Coverage and Delivery Timelines",
    body: "We currently ship only within India and do not offer international shipping; all purchases can be delivered to any address within India. We use ground-based courier partners for delivery. Estimated delivery timelines are 7–10 business days from the date of dispatch, depending on your location and the serviceability of your PIN code. Delivery timelines are estimates only and may vary due to courier delays, weather, regulatory checks, or other circumstances beyond our reasonable control.",
  },
  {
    heading: "1.2 Serviceability and Cash-on-Delivery (COD)",
    body: "Not all PIN codes are eligible for delivery, and not all serviceable PIN codes are eligible for Cash-on-Delivery. Please enter your PIN code on the product page or at checkout to confirm delivery and COD eligibility for your address before placing your order.",
  },
  {
    heading: "1.3 Shipping and COD Charges",
    body: "Orders below a specified value may be subject to a shipping charge, as applicable. A Cash-on-Delivery (COD) handling fee applies to all COD orders, in addition to any applicable shipping charge. All applicable charges are displayed at checkout before you complete payment and are included in the order total.",
  },
  {
    heading: "1.4 Order Confirmation and Tracking",
    body: "Once your order is placed, you will see an on-screen order confirmation and receive a confirmation e-mail/message containing your order number. Once your order is dispatched, you will receive an e-mail and/or SMS with the tracking details and courier partner information. You can track your order at any time through the “My Orders” section of your account or via the tracking link shared with you.",
  },
  {
    heading: "1.5 Payments",
    body: "We currently accept payment through Razorpay and the payment modes it supports (in addition to Cash-on-Delivery, where eligible). Please do not send us your card, UPI, or other payment credentials by e-mail, WhatsApp, or any other unencrypted channel — we will never ask you to do so. Payments made through the Website are processed over an encrypted, SSL-secured connection.",
  },
  {
    heading: "1.6 Damaged or Defective Products on Delivery",
    body: "Please inspect your package at the time of delivery and avoid accepting a shipment with visibly damaged or tampered outer packaging. If you receive a damaged, defective, or incorrect product, please report it in accordance with, and within the time limits set out in, our Return, Exchange & Refund Policy, including the mandatory unboxing-video requirement described there. Only one return or replacement will be processed per reported issue per order.",
  },
  {
    heading: "1.7 Force Majeure",
    body: "Meenazo shall not be liable for any delay or failure to perform any obligation under this Policy where such delay or failure arises from a cause beyond our reasonable control, including but not limited to acts of God, fire, flood, earthquake, or other natural disaster; war, riot, civil commotion, or terrorism; strikes, lockouts, or other industrial action; epidemic or pandemic; any order, regulation, restriction, or other action by a government or regulatory authority; or failure or disruption of courier, transportation, or telecommunications networks (each, a “Force Majeure Event”). Where a Force Majeure Event affects our ability to fulfil, dispatch, or deliver an order, the estimated delivery timelines set out in this Policy shall be extended for the duration of the Force Majeure Event, and we will make reasonable efforts to notify you of any material delay. If a Force Majeure Event continues for a period exceeding 30 days and we remain unable to fulfil your order, either party may cancel the order, in which case any amount paid by you will be refunded in accordance with Section 4 of this Policy.",
  },
  {
    heading: "2. Order Cancellation by You",
    body: "You may cancel your order, in full or in part, free of charge, at any time before it has been dispatched. Once an order has been dispatched, it can no longer be cancelled; in that case, you may instead raise a return request once the product is delivered, in accordance with our Return, Exchange & Refund Policy. To cancel an order before dispatch, please write to us at care@meenazo.in or contact our customer support team, quoting your order number.",
  },
  {
    heading: "2.1 Discount Vouchers and Loyalty Points",
    body: "Discount vouchers and coupon codes are intended for one-time use and will be treated as used even if the order in which they were applied is subsequently cancelled. Loyalty points redeemed against a cancelled order will be credited back to your account.",
  },
  {
    heading: "3. Order Cancellation by Meenazo",
    body: [
      "While we make every effort to fulfil every order placed on the Website, we may need to cancel an order, in whole or in part, in circumstances including:",
      {
        list: [
          "a. The product is unavailable or out of stock;",
          "b. A limit applies to the quantity of the product available for purchase;",
          "c. There is an inaccuracy or error in the product listing, price, or promotional information;",
          "d. The delivery address provided is inaccurate, incomplete, or non-serviceable;",
          "e. We are unable to verify the order or require additional information to process it and are unable to reach you; or",
          "f. We reasonably suspect the order is fraudulent or in breach of our Terms of Use, including our Maximum Purchase Policy below.",
        ],
      },
      "We will notify you if we cancel your order, or if we require further information or verification before processing it. Where we cancel an order after payment has been received, we will refund the full amount paid in accordance with Section 4 below. We will not, however, be liable for any cancellation charges, as we do not levy any charge on you for a cancellation we initiate.",
    ],
  },
  {
    heading: "4.1 Refund Timeline",
    body: "Where a refund is due — whether because an order was cancelled before dispatch, cancelled by us, or a return/replacement was approved under our Return, Exchange & Refund Policy — we will process the refund within 7 – 10 business days of the cancellation approval, as applicable. For prepaid orders (credit card, debit card, UPI, or net banking), the amount will be refunded to the original payment method used; where the refund is issued to an e-wallet, credit is typically available within 5-7 working days. Please note that once we have processed a refund, the time it takes to reflect in your account or statement depends on your bank's or payment provider's own processing timelines, which are outside our control.",
  },
  {
    heading: "4.2 Non-Refundable Charges",
    body: "Cash-on-Delivery handling charges and shipping charges already incurred are non-refundable, except where the order is cancelled or returned due to our error (including a wrong or defective product), in which case the full amount paid, including such charges, will be refunded.",
  },
  {
    heading: "4.3 Regulatory Compliance",
    body: "All refunds are processed in accordance with the timelines prescribed by the Reserve Bank of India and other applicable regulatory guidelines, and we do not levy a cancellation charge on you unless an equivalent charge is also borne by us.",
  },
  {
    heading: "5. Maximum Purchase Policy",
    body: "Our products, including any samples, are intended for personal use only. Certain products may be subject to a maximum purchase quantity per order or per customer within a given period; where an order exceeds this limit, we may reduce, cancel, or decline to fulfil the excess quantity, and you may be temporarily restricted from purchasing that product again for a reasonable period. If we have reason to believe a customer is purchasing our products for resale rather than personal use, we reserve the right to cancel the relevant order(s) and to take appropriate legal action.",
  },
  {
    heading: "6. Order Issues and Grievance Redressal",
    body: "If you experience any issue with your order — including delivery delays, a damaged or incorrect product, or a payment or refund concern — please contact our customer support team at care@meenazo.in. If you are not satisfied with the resolution provided, you may escalate the matter to our Grievance Officer, whose details are set out in the Grievance Redressal section of our Terms of Use. In accordance with applicable law, complaints raised with the Grievance Officer will be acknowledged within 48 (forty-eight) hours and, wherever possible, resolved within 1 (one) month of receipt.",
  },
  {
    heading: "7. Changes to This Policy",
    body: "We may update this Policy from time to time to reflect changes in our operations or applicable law. Any changes will be posted on this page with a revised “Last updated” date, and will apply to orders placed after the change takes effect. We encourage you to review this Policy periodically.",
  },
];

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping & Cancellation Policy"
      lastUpdated="11 August 2026"
      intro={intro}
      sections={sections}
    />
  );
}
