import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Return, Exchange & Refund Policy",
  description:
    "The Return, Exchange & Refund Policy governing all purchases from Meenazo — eligibility, the mandatory unboxing video, the 5-day window, and how refunds are processed.",
  path: "/return-policy",
});

const intro = [
  "This Return, Exchange & Refund Policy (“Policy”) governs all purchases made from Meenazo Private Limited (“Meenazo”, “Company”, “we”, “us”, or “our”) through our online or offline channel, including our website, marketplace listings, and direct sales. By completing a purchase, the customer (“you”) expressly agrees to be bound by the terms of this Policy. This Policy forms part of the Terms & Conditions of Sale.",
  "Meenazo sells Ayurvedic and herbal wellness products. Product results may vary based on individual constitution, lifestyle, health condition, and usage patterns. Dissatisfaction with product efficacy, taste, smell, texture, or personal preference does not constitute a defect and does not entitle the customer to a return, exchange, or refund under this Policy.",
];

/** Supplied verbatim by the company — do not paraphrase or re-order clauses. */
const sections: LegalSection[] = [
  {
    heading: "1. General Eligibility for Return & Exchange",
    body: [
      "A request for return or exchange will only be considered if ALL of the following conditions are satisfied:",
      {
        list: [
          "a) The request is submitted to care@meenazo.in within 5 (five) calendar days of the date of delivery of the product;",
          "b) The product is in its original, unopened, and unused condition, with all original packaging, seals, tags, and invoice intact;",
          "c) The customer provides a valid unboxing video recorded at the time of opening the package (see Clause 2 below);",
          "d) The reason for return falls within an eligible category as specified in Clause 3 of this Policy; and",
          "e) The claim is verified and approved by Meenazo Private Limited at its sole discretion.",
        ],
      },
      "Failure to satisfy any one of the above conditions will render the request ineligible for consideration.",
    ],
  },
  {
    heading: "2. Mandatory Unboxing Video Requirement",
    body: [
      "To protect both the customer and the Company against fraudulent or false claims:",
      {
        list: [
          "a) All customers are strongly advised and required to record a continuous, uninterrupted video of the unboxing of every product received from Meenazo at the time of opening.",
          "b) The unboxing video must clearly show: (i) the sealed outer packaging; (ii) the opening process; (iii) the product condition upon opening; and (iv) the invoice/order confirmation.",
          "c) In the absence of an unboxing video, no claim for damage or defect shall be entertained by the Company. The Company shall not be liable for any damage alleged to have occurred during transit or delivery where no such video evidence is provided.",
          "d) The unboxing video must be submitted along with the return/exchange request email within the 5-day window.",
        ],
      },
    ],
  },
  {
    heading: "3. Eligible Reasons for Return or Exchange",
    body: [
      "Returns and exchanges will only be accepted for the following reasons:",
      {
        list: [
          "a) Wrong Product Delivered — The product received is different from the product ordered as confirmed in the order confirmation email;",
          "b) Damaged in Transit — The product packaging or contents are physically damaged at the time of delivery (evidenced by unboxing video); or",
          "c) Manufacturing Defect — The product suffers from a bona fide manufacturing or packaging defect present at the time of delivery and confirmed by the Company's quality team.",
        ],
      },
      "For the purposes of this Policy, a “defect” means a manufacturing or packaging fault present at the time of delivery. It does not include dissatisfaction with results, efficacy, taste, smell, texture, or personal preference.",
    ],
  },
  {
    heading: "3.1 Non-Eligible Reasons (Expressly Excluded)",
    body: [
      "The following shall not be accepted as grounds for return, exchange, or refund:",
      {
        list: [
          "a) Change of mind or personal preference;",
          "b) Dissatisfaction with product results, taste, smell, texture, or efficacy;",
          "c) Products that have been opened, used, tampered with, or are no longer in original condition;",
          "d) Products damaged due to improper use, negligence, incorrect application, or failure to follow usage instructions;",
          "e) Products where original packaging, seals, tags, or invoice are missing or tampered;",
          "f) Requests made after the 5-day window from the date of delivery; and",
          "g) Products purchased under any promotional offer, discount, or free trial scheme, except where the wrong product was delivered.",
        ],
      },
    ],
  },
  {
    heading: "4. Allergy & Adverse Reaction Claims",
    body: [
      "Meenazo takes product safety seriously. In the event a customer experiences an allergic reaction or adverse effect allegedly caused by a Meenazo product, the following conditions must be fulfilled to be considered for a refund or exchange:",
      {
        list: [
          "a) The claim must be reported to care@meenazo.in within 5 (five) calendar days of the onset of the reaction;",
          "b) The customer must submit clear photographs and/or video documentation of the alleged reaction on the body, taken at the time of the reaction;",
          "c) The customer must submit a medical certificate or prescription from a registered medical practitioner (MBBS or a practitioner registered under the applicable State Medical Council) expressly stating that the reaction is consistent with or attributable to the use of the specific Meenazo product;",
          "d) All medical records, prescriptions, and test reports relevant to the claimed reaction must be submitted;",
          "e) Meenazo reserves the right to have the submitted documentation reviewed by an independent medical expert of its choice before making a determination; and",
          "f) Claims based solely on self-reported discomfort or personal sensitivity, without supporting medical documentation and photos/videos as specified above, will not be entertained.",
        ],
      },
    ],
  },
  {
    heading: "4.A Returns Based on Medical Advice to Discontinue Use",
    body: [
      "Where a customer seeks a return, exchange, or refund on the ground that a doctor or other medical practitioner has advised them to discontinue use of a Meenazo product — including where no allergic reaction or adverse effect is alleged — the following conditions must be satisfied for the request to be considered:",
      {
        list: [
          "a) The request must be reported to care@meenazo.in within 5 (five) calendar days of the date of such medical advice;",
          "b) The customer must submit a valid medical certificate or prescription from a registered medical practitioner (MBBS or a practitioner registered under the applicable State Medical Council), clearly stating that the customer has been advised to discontinue use of the specific Meenazo product, along with the reason for such advice;",
          "c) The certificate or prescription must bear the practitioner's name, registration number, and date, and must relate to the specific product for which the return is sought;",
          "d) Meenazo reserves the right to have the submitted documentation verified or reviewed by an independent medical expert of its choice before making a determination;",
          "e) A bare assertion that a doctor has advised discontinuation, without supporting documentation as specified above, shall be treated as a change of mind under Clause 3.1(a) and shall not be eligible for return, exchange, or refund; and",
          "f) Where the product has already been opened or partially used, Meenazo may, at its sole discretion, offer a refund only for the unused/unopened portion of the product (if separately packaged) or such other remedy as it deems appropriate, having regard to the medical documentation submitted.",
        ],
      },
      "Approval of a refund or exchange under this Clause is at the sole discretion of Meenazo Private Limited, subject to verification and review of all submitted documentation. This Clause does not restrict any rights available to the customer under applicable law.",
    ],
  },
  {
    heading: "5. Damaged or Defective Products",
    body: [
      {
        list: [
          "a) If a product arrives damaged or defective, the customer must notify Meenazo at care@meenazo.in within 48 (forty-eight) hours of delivery, along with the mandatory unboxing video and photographs evidencing the damage or defect.",
          "b) Upon receipt of the complaint and evidence, our team will assess the claim and contact the customer to verify the damage or defect prior to initiating any replacement.",
          "c) If the claim is verified, Meenazo will arrange for an exchange of the defective/damaged product. No cash refund will be offered for a defective/damaged product; only a replacement will be provided.",
          "d) Products damaged due to improper usage, neglect, incorrect application, or failure to follow product usage instructions are not eligible under this Clause.",
        ],
      },
    ],
  },
  {
    heading: "6. Return & Exchange Process",
    body: [
      {
        list: [
          "a) To initiate a return or exchange, the customer must email care@meenazo.in within the applicable window with: (i) order ID and invoice; (ii) reason for return/exchange; (iii) unboxing video; and (iv) photographs of the product and packaging.",
          "b) All return requests are subject to quality inspection and verification by Meenazo. The Company reserves the right to reject any request that does not meet the conditions of this Policy.",
          "c) If the return request is approved, Meenazo will arrange for pickup of the product. The customer must ensure the product is securely packed in its original packaging for return courier. Return shipping will be coordinated by Meenazo; no self-arranged courier returns will be accepted.",
          "d) Upon receipt of the returned product, Meenazo will conduct a quality inspection. The exchange or refund (as applicable) will be processed only if the product passes inspection.",
          "e) It will take 10 – 15 business days from receipt and inspection of the returned product for the exchange or refund to be processed.",
          "f) Meenazo reserves the right to refuse returns or exchanges from customers who exhibit a pattern of repeated or frivolous return requests, or where fraud is suspected.",
        ],
      },
    ],
  },
  {
    heading: "7. Shipping Charges",
    body: [
      {
        list: [
          "a) Shipping charges are non-refundable under all circumstances, including where a return or exchange is approved.",
          "b) Shipping charges applicable to free trial products and promotional shipments are also non-refundable.",
        ],
      },
    ],
  },
  {
    heading: "8. Non-Refundable Items & Transactions",
    body: [
      "No refund shall be made in respect of:",
      {
        list: [
          "a) Products that have been opened, used, or are no longer in their original, unopened, and sellable condition;",
          "b) Products purchased under a discounted, promotional, or bundled offer, except where a wrong product was delivered (in which case only an exchange will be offered, not a cash refund);",
          "c) Shipping charges in all cases;",
          "d) Products for which the return request was made after the 5-day window from the date of delivery; and",
          "e) Free trial products.",
        ],
      },
    ],
  },
  {
    heading: "9. Offer & Promotional Pricing",
    body: [
      {
        list: [
          "a) Discounted, promotional, or offer prices (“Offer Price”) are valid strictly for orders placed during the specified offer period (“Offer Window”) as displayed on the website or platform at the time of purchase.",
          "b) If an order is placed before or after the Offer Window, the Offer Price shall not apply, and no refund of the price difference, retrospective discount, or price adjustment shall be made, regardless of the date of delivery, return, or exchange.",
          "c) Where a product purchased at an Offer Price is subsequently returned or exchanged, any replacement product shall be issued at the price applicable on the date of exchange, and not at the original Offer Price, unless the exchange falls strictly within Clause 3(a) (wrong product delivered).",
          "d) No request for honouring an expired or inapplicable Offer Price shall be entertained under any circumstances, including on grounds of technical error, delayed checkout, or payment delay, unless such error is solely attributable to and verified as a system fault on the part of Meenazo.",
        ],
      },
    ],
  },
  {
    heading: "10. Refund Procedure",
    body: [
      {
        list: [
          "a) Refunds, where applicable and approved, will be processed within 7 to 21 working days from the later of: (i) receipt and inspection of the returned product by Meenazo; or (ii) the customer providing correct bank/UPI account details for transfer.",
          "b) Refunds will be credited to the original payment instrument (credit/debit card, UPI, net banking, or digital wallet) used at the time of purchase.",
          "c) For Cash-on-Delivery (COD) orders, where eligible for refund, the amount will be transferred via NEFT/IMPS/UPI to the bank account details provided by the customer. No cash refunds will be issued under any circumstances, including where the original payment was made in cash.",
          "d) No refund will be processed for orders where any form of discount, coupon, or promotional pricing was applied, except in the case of a wrong product delivered (where only an exchange will be offered).",
          "e) Meenazo's liability in any return or refund matter shall be strictly limited to the purchase price of the product as reflected on the invoice, excluding shipping charges.",
        ],
      },
    ],
  },
  {
    heading: "11. Cash-on-Delivery Orders & Proof of Delivery (POD)",
    body: [
      "Given the higher risk of disputes and fraudulent claims associated with Cash-on-Delivery (“COD”) orders, the following additional terms shall apply:",
      {
        list: [
          "a) Exchange requests for COD orders must be raised within 5 (five) calendar days of the date reflected on the Proof of Delivery (“POD”), failing which the request shall not be entertained.",
          "b) POD as Sole Basis of Delivery Verification — The POD generated by the courier/logistics partner, including the date, time, and recipient details recorded at the point of delivery, shall be treated as conclusive evidence of the date and fact of delivery for the purposes of computing all timelines under this Policy, including the unboxing video requirement, defect reporting window, and return window.",
          "c) Discrepancy in POD — Where a customer disputes the accuracy of the POD (e.g., alleges non-delivery of products), the customer must raise such dispute in writing to care@meenazo.in within 72 hrs of the date reflected on the POD, failing which the POD date shall be treated as final and binding for all purposes under this Policy.",
          "d) COD orders shall remain subject to all other conditions of this Policy, including the unboxing video requirement, eligible reasons for return, and quality inspection process, in addition to the COD-specific terms in this Clause.",
        ],
      },
    ],
  },
  {
    heading: "12. Fraudulent, Repeated & Frivolous Claims",
    body: [
      {
        list: [
          "a) Meenazo reserves the right to refuse return or refund requests where it has reasonable grounds to believe the claim is fraudulent, exaggerated, or made in bad faith.",
          "b) Customers with a history of repeated, suspicious, or frivolous return requests may be denied future return or exchange privileges at the Company's sole discretion.",
          "c) Meenazo reserves the right to take legal action against any customer found to have made a fraudulent return or refund claim, including claims based on fabricated evidence.",
        ],
      },
    ],
  },
  {
    heading: "13. Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, Meenazo Private Limited's aggregate liability arising out of or in connection with any return, exchange, or refund claim shall not exceed the purchase price of the product as reflected on the invoice, excluding shipping charges. The Company shall not be liable for any indirect, consequential, incidental, or punitive damages of any nature.",
  },
  {
    heading: "14. Policy Amendments",
    body: "Meenazo Private Limited reserves the right to amend, modify, or update this Policy at any time without prior notice. The version of this Policy in effect at the time of the customer's purchase shall govern that transaction. Customers are advised to review this Policy prior to each purchase.",
  },
  {
    heading: "15. Governing Law & Jurisdiction",
    body: "This Policy shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with this Policy shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.",
  },
  {
    heading: "16. Contact & Grievance Redressal",
    body: [
      "For all return, exchange, refund queries, or grievances, please contact:",
      "Email: care@meenazo.in",
      "Meenazo Private Limited",
    ],
  },
  {
    heading: "Disclaimer",
    body: "This Policy does not restrict or exclude any rights conferred on consumers under the Consumer Protection Act, 2019, or any other applicable law. Nothing in this Policy shall be construed as contracting out of statutory consumer rights.",
  },
];

export default function ReturnPolicyPage() {
  return (
    <LegalPage
      title="Return, Exchange & Refund Policy"
      lastUpdated="11 August 2026"
      intro={intro}
      sections={sections}
    />
  );
}
