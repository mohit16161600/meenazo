import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description:
    "The Terms of Use governing your access to the Meenazo website and the purchase of our Ayurvedic and herbal wellness products.",
  path: "/terms",
});

const intro =
  "BY ACCESSING THIS WEBSITE, CREATING AN ACCOUNT, OR PLACING AN ORDER THROUGH www.meenazo.com (the “Website”), YOU AGREE TO BE BOUND BY THESE TERMS OF USE (“Terms”). PLEASE READ THESE TERMS, OUR PRIVACY POLICY, OUR RETURN, EXCHANGE & REFUND POLICY, OUR SHIPPING & CANCELLATION POLICY, AND OUR LEGAL DISCLAIMER CAREFULLY BEFORE USING THE WEBSITE OR PLACING AN ORDER. EACH OF THESE DOCUMENTS IS INCORPORATED INTO THESE TERMS BY REFERENCE. IF YOU DO NOT AGREE TO THESE TERMS, PLEASE DO NOT USE THE WEBSITE.";

/** Supplied verbatim by the company — do not paraphrase or re-order clauses. */
const sections: LegalSection[] = [
  {
    heading: "1. Overview",
    body: [
      "This Website is owned and operated by Meenazo Private Limited, a company incorporated under the Companies Act, 2013 (CIN U24100DL2021PTC377752), having its registered office at E-44/10, Okhla Industrial Area, Phase 2, Entire First Floor, Okhla Industrial Estate, South Delhi, New Delhi, Delhi, India, 110020 (“Meenazo”, “Company”, “we”, “us”, or “our”). Throughout these Terms, “you” and “User” refer to any person who accesses, browses, registers on, or transacts through the Website.",
      "By visiting the Website and/or purchasing a product from us, you engage in our “Service” and agree to be bound by these Terms, which apply to all Users of the Website, including browsers, registered users, and guest checkout users. We may, in our sole discretion, withdraw, amend, suspend or modify the Service or any part of it at any time without prior notice, and we will not be liable if the Website is unavailable at any time or for any period.",
    ],
  },
  {
    heading: "2. Eligibility and Capacity to Contract",
    body: [
      "To create an account, place an order, or otherwise transact on the Website, you must be a person competent to contract under the Indian Contract Act, 1872 — that is, you must be at least 18 years of age and of sound mind, and must not be a person disqualified from contracting under any law for the time being in force. Persons who are not competent to contract, including undischarged insolvents, may not use the Website to place orders.",
      "If you are under 18 years of age, you may browse the Website only under the supervision of, and orders on your behalf may only be placed by, your parent or lawful guardian. A parent or legal guardian who permits or facilitates a minor's use of the Website, or who places an order on a minor's behalf, is solely responsible for that use and for any orders placed, and agrees to be bound by these Terms on the minor's behalf.",
      "If you are accessing or using the Website, or placing an order, on behalf of another person or entity, you represent and warrant that you have the authority to bind that person or entity to these Terms. If that person or entity does not accept these Terms, you agree to personally accept liability for any loss or harm arising from such access, use, or order.",
      "You may register for an account, or check out as a guest. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
    ],
  },
  {
    heading: "3. Acceptable Use",
    body: [
      "You agree that you will not use the Website or the Service for any unlawful or unauthorised purpose, and will not, in your use of the Service, violate any applicable law, including intellectual property, data protection, and consumer protection laws. You must not transmit any worms, viruses, malware, or any code of a destructive nature. A breach of any of these Terms will result in immediate suspension or termination of your access to the Service, without prejudice to any other remedy available to us.",
      "You agree that you will not, in connection with your use of the Website:",
      {
        list: [
          "a. Disseminate any unlawful, harassing, libellous, abusive, threatening, harmful, vulgar, obscene, or otherwise objectionable material;",
          "b. Infringe the intellectual property rights of Meenazo or any third party;",
          "c. Transmit material that encourages conduct constituting a criminal offence, gives rise to civil liability, or otherwise breaches any applicable law, regulation, or code of practice;",
          "d. Attempt to gain unauthorised access to any part of the Website, other Users' accounts, or any computer system or network connected to the Website;",
          "e. Interfere with, disrupt, or place an undue burden on the Website or the networks or services connected to it, including via a denial-of-service attack;",
          "f. Reproduce, duplicate, copy, sell, resell, or otherwise commercially exploit any portion of the Service without our express written permission; or",
          "g. Transmit unsolicited advertising, promotional material, or “spam” of any kind.",
        ],
      },
      "A breach of this Section may constitute a criminal offence. We reserve the right to report any such breach to the relevant law enforcement authorities and to disclose your identity to them, and we will not be liable for any loss or damage arising from a distributed denial-of-service attack, virus, or other technologically harmful material affecting your equipment as a result of your use of the Website.",
    ],
  },
  {
    heading: "4. Communication and Consent",
    body: [
      "By registering on or transacting through the Website, you consent to receive transactional and, where you have separately opted in, promotional communications from us by e-mail, SMS, WhatsApp, voice call, and other electronic means, concerning your account, orders, and our products and services. You may withdraw consent to promotional communications at any time using the unsubscribe link provided in such communications or by writing to us; this will not affect transactional communications necessary to service your order.",
      "Wherever the Website requires your consent — including consent to these Terms, to the Privacy Policy, or to complete a purchase — that consent is recorded only on the basis of a clear, explicit, and affirmative action taken by you (such as checking an unchecked box or clicking “I agree”/“Place Order”). We do not use pre-ticked checkboxes or any other default-opt-in mechanism to record your consent for any purpose, in accordance with Rule 4(9) of the Consumer Protection (E-Commerce) Rules, 2020.",
    ],
  },
  {
    heading: "5. Privacy",
    body: "Our Privacy Policy sets out how we collect, use, share, and protect your personal information, and can be found at https://meenazo.com/privacy-policy. Our processing of your personal data is carried out in accordance with the Information Technology Act, 2000 and the rules made thereunder, and the Digital Personal Data Protection Act, 2023 read with the Digital Personal Data Protection Rules, 2025, as amended from time to time. By using this Website, you consent to the processing of your personal data as described in the Privacy Policy and warrant that all data you provide to us is true and accurate.",
  },
  {
    heading: "6. Product, Health, and Advertising Disclaimer",
    body: [
      "Meenazo’s products are Ayurvedic and herbal wellness products formulated using traditional knowledge and natural ingredients to support overall well-being. Our product claims relate only to the intended cosmetic, nutritional, or traditional Ayurvedic wellness use of the product, as applicable, and should not be interpreted as a therapeutic claim — that is, a claim to diagnose, treat, cure, mitigate, or prevent any disease or medical condition — unless such claim has been specifically approved for that product by the relevant regulatory authority. Nothing on the Website constitutes medical advice. Results may vary between individuals. We recommend you consult a qualified medical practitioner before using our products, particularly if you are pregnant or breastfeeding, have a pre-existing health condition, are on medication, or intend to use a product for or on behalf of a minor. This Section 6 is supplemental to, and must be read together with, our standalone Legal Disclaimer, which governs in the event of any inconsistency.",
      "Our products are manufactured in accordance with the Drugs and Cosmetics Act, 1940 and the rules made thereunder, under AYUSH/State Licensing Authority licence number 821/AY-PB. We take reasonable care to ensure that product descriptions, claims, and advertisements on the Website accurately reflect the actual composition, features, and characteristics of our products, and we do not knowingly publish a description or claim inconsistent with a product's approved formulation or label.",
    ],
  },
  {
    heading: "7. Customer Care / Wellness Advisor Disclaimer",
    body: "Any guidance, recommendation, or information provided by our customer care executives, wellness advisors, or diet experts — whether during a free consultation, over WhatsApp, by phone, or through any other channel — is general product guidance only, based on the information you choose to share, and does not constitute medical advice, diagnosis, or treatment. Such guidance is not a substitute for consultation with a qualified medical practitioner, and Meenazo shall not be liable for any decision made or action taken in reliance on it. This Section is supplemental to, and must be read together with, our Legal Disclaimer.",
  },
  {
    heading: "8. Hair & Wellness Category-Specific Disclaimer",
    body: "Certain conditions addressed by our wellness products, such as hair fall, hair thinning, or skin concerns, may have multiple underlying causes, including genetic, hormonal, nutritional, medical, and lifestyle factors, and our products are not intended to diagnose or treat any such underlying medical condition. If you experience persistent, severe, or worsening symptoms, please consult a qualified healthcare professional rather than relying solely on our products or website content.",
  },
  {
    heading: "9. Intellectual Property",
    body: [
      "“MEENAZO”, the Meenazo logo, and all related product names, packaging design, and marks used on the Website are trademarks of Meenazo Private Limited, whether or not registered, protected under the Trade Marks Act, 1999 and applicable common law. Unauthorised use of any Meenazo trademark, including in metatags, keyword advertising, or on any competing or third-party platform, is prohibited and may be pursued as trademark infringement or passing off.",
      "Separately, all software, text, graphics, photographs, videos, product images, website design and layout, landing pages, educational and informational content, product formulation descriptions, and other content made available on or through the Website (together, “Content”) is the property of Meenazo or its licensors and is protected by copyright and other applicable intellectual property laws, to the extent such Content qualifies for protection under applicable law. You may store, print, and display the Content solely for your personal, non-commercial use. You may not publish, distribute, manipulate, reproduce, or otherwise use the Content, or any part of it, in connection with any business or commercial enterprise without our express written permission.",
      "Where any Content is generated in whole or in part using artificial intelligence tools, Meenazo asserts all rights it is legally entitled to assert in such Content, including as a compilation, and treats such Content as proprietary and confidential business information regardless of its copyright status. Nothing in this Section requires Meenazo to identify which specific Content was AI-assisted.",
    ],
  },
  {
    heading: "10. Terms of Sale",
    body: [
      "10.1 Placing an Order — By placing an order, you are making an offer to purchase the relevant product(s) on and subject to these Terms. All orders are subject to product availability and confirmation of the order price. All prices on the Website are quoted, and all payments are made, in Indian Rupees (INR) only; the Website does not currently offer international shipping or foreign-currency pricing.",
      "10.2 Order Confirmation and Contract Formation — On placing an order, you will receive an acknowledgment e-mail confirming receipt of your order; this acknowledgment does not, by itself, constitute our acceptance of your order. A binding contract of sale is formed only when we send you a separate confirmation that the ordered goods have been dispatched. Only the goods listed in that dispatch confirmation are included in the resulting contract. We reserve the right to accept or decline any order, in whole or in part, for any reason, including product unavailability, pricing or listing errors, or non-serviceability of the delivery address.",
      "10.3 Pricing, Availability and Advertising Accuracy — We take reasonable care to ensure that all prices, descriptions, and other details appearing on the Website are accurate and consistent with the actual features of the goods offered, in accordance with Rule 5 of the Consumer Protection (E-Commerce) Rules, 2020. Errors may nonetheless occur. If we discover a pricing or listing error in an order you have placed, we will inform you as soon as reasonably possible and give you the option to reconfirm the order at the correct price or cancel it; where you cancel and have already paid, you will receive a full refund. Delivery charges, where applicable, are displayed separately and included in the order total shown at checkout.",
      "10.4 Payment — On receiving your order, we (or our payment partner) carry out a standard authorisation check on your payment method. Your payment instrument will be debited on successful authorisation; the amount so collected is held against the value of the goods ordered and is applied towards payment for those goods once they are dispatched and a dispatch confirmation is sent to you.",
    ],
  },
  {
    heading: "11. Third-Party Links and Content",
    body: "The Website may contain links to, or content sourced from, third-party websites or platforms that are not operated or controlled by us. We do not examine, endorse, or warrant the accuracy of any third-party content, and we are not responsible or liable for any products, services, or materials made available through such third-party links. You should review the terms and privacy practices of any third-party site before transacting with it. Complaints regarding third-party products or services should be directed to that third party; Meenazo is not liable for any act or omission of a third party.",
  },
  {
    heading: "12. Fraudulent or Declined Transactions",
    body: "Our payment partners and our internal fraud-detection processes monitor transactions to prevent fraudulent use of the Website. A User who fraudulently avails of a discount, coupon, or voucher, or otherwise defrauds the Website, shall be liable for legal action, and we reserve the right to recover the cost of goods, collection charges, and legal fees from such User. Where we detect a fraudulent or declined transaction, we may, prior to initiating legal action, suspend or delete the relevant account and cancel any pending or past orders associated with it, without liability to refund amounts paid in connection with the fraudulent conduct.",
  },
  {
    heading: "13. Disclaimer of Warranties; Limitation of Liability",
    body: [
      "Except as expressly stated in these Terms or as required by applicable law (including your statutory rights as a consumer), the Website and the products and services made available through it are provided on an “as is” and “as available” basis, without warranties or conditions of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Website will be uninterrupted, timely, secure, or error-free.",
      "To the fullest extent permitted by law, Meenazo Private Limited, together with its directors, officers, employees, affiliates, agents, and service providers, will not be liable for any indirect, incidental, punitive, special, or consequential damages of any kind (including lost profits, lost revenue, or loss of data) arising out of or connected with your use of the Website or any product purchased through it, whether based in contract, tort (including negligence), or otherwise, even if advised of the possibility of such damages. Our aggregate liability to you in connection with any order shall not, in any event, exceed the amount actually paid by you for the product(s) giving rise to the claim.",
      "Where applicable law does not permit the exclusion or limitation of certain warranties or of liability for incidental or consequential damages, the above exclusions and limitations apply to the maximum extent permitted by law, and our liability shall be limited accordingly rather than excluded outright.",
    ],
  },
  {
    heading: "14. Reviews, Feedback and Submissions",
    body: [
      "We welcome your reviews, comments, and feedback on our products and Service. Any reviews, comments, feedback, suggestions, or other submissions you disclose or offer to us in connection with the Website (“Comments”) shall become our property, and by submitting Comments you assign to us all worldwide right, title, and interest in the copyright and other intellectual property in such Comments, and grant us the unrestricted right to use, reproduce, modify, publish, and distribute them for any purpose, without compensation to you. We are under no obligation to keep any Comments confidential, to compensate you for them, or to respond to them. You agree that any Comments you submit will not be unlawful, defamatory, obscene, or infringing of any third party's rights, and will not contain malicious code or spam.",
      "Without limiting the generality of the foregoing, you must not, in any review, comment, testimonial, or other submission on or in connection with the Website:",
      {
        list: [
          "a) make any false, unsubstantiated, or misleading medical, therapeutic, or efficacy claim about any Meenazo product;",
          "b) post a fake, incentivized-but-undisclosed, or fabricated testimonial, or review a product you have not genuinely purchased or used; or",
          "c) manipulate, edit, or misrepresent images, ratings, or content in a manner intended to mislead other users.",
        ],
      },
      "We reserve the right to remove any review or Comment that violates this Section and to take appropriate action, including suspension of your account, without prejudice to any other remedy available to us.",
    ],
  },
  {
    heading: "15. Grievance Redressal",
    body: [
      "In accordance with Rule 4 of the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, Meenazo has appointed the following Grievance Officer and Nodal Officer to address User grievances relating to the Website:",
      "POINT OF CONTACT",
      {
        list: [
          "Grievance Officer: Ms. Surbhi Kapoor",
          "Contact No.: +91 99999 97554",
        ],
      },
      "You can also write to care@meenazo.in.",
      "The Grievance Officer will acknowledge receipt of any consumer complaint within 48 (forty-eight) hours and will endeavour to redress it within 1 (one) month of receipt, in accordance with applicable law.",
    ],
  },
  {
    heading: "16. Indemnification",
    body: "You agree to indemnify, defend, and hold harmless Meenazo Private Limited, its parent, subsidiaries, affiliates, and their respective officers, directors, employees, agents, and service providers from any claim or demand, including reasonable legal fees, made by any third party arising out of or connected with your breach of these Terms or the documents incorporated into them, or your violation of any law or the rights of a third party.",
  },
  {
    heading: "17. Modification of These Terms",
    body: "We may modify these Terms at any time by posting the revised Terms on the Website, which will be effective on posting unless a later date is specified. You are responsible for reviewing these Terms periodically; your continued use of the Website following any modification constitutes your acceptance of the modified Terms. If you do not agree to a modification, your only remedy is to stop using the Website.",
  },
  {
    heading: "18. Term, Termination and Survival",
    body: "These Terms remain effective until terminated by either you or us. You may stop using the Website at any time to terminate your agreement to these Terms. We may suspend or terminate your access to the Service at any time, without notice, if we believe, in our sole judgment, that you have breached these Terms; you will remain liable for all amounts due up to the date of termination. Provisions of these Terms that by their nature ought to survive termination — including ownership, warranty disclaimers, indemnification, and limitation of liability — will survive.",
  },
  {
    heading: "19. Severability",
    body: "If any provision of these Terms is held to be unlawful, void, or unenforceable, that provision shall be severed, and the remaining provisions shall continue in full force and effect. Where a provision can be modified to render it valid while preserving its original intent as closely as possible, it shall be interpreted accordingly.",
  },
  {
    heading: "20. Waiver",
    body: "No failure or delay by us in exercising any right or provision of these Terms shall operate as a waiver of that right or provision, nor shall it prevent us from later enforcing that or any other right or provision.",
  },
  {
    heading: "21. Governing Law and Dispute Resolution",
    body: [
      "These Terms are governed by the laws of India. In the event of any dispute, claim, or controversy arising out of or relating to these Terms, the Website, or any order (a “Dispute”), the parties shall first attempt, in good faith, to resolve the Dispute through mutual discussion within 30 (thirty) days of one party notifying the other in writing.",
      "If a Dispute is not resolved through such discussion, it shall be referred to and finally resolved by arbitration under the Arbitration and Conciliation Act, 1996, before a sole arbitrator appointed by Meenazo. The seat and venue of arbitration shall be New Delhi, India, and the language of arbitration shall be English. The arbitral award shall be final and binding on the parties, subject to any right of appeal available under applicable law. Nothing in this Section prevents either party from seeking interim or urgent relief from a court of competent jurisdiction. Subject to the foregoing, the courts at Delhi, India shall have exclusive jurisdiction over any matter arising under or relating to these Terms.",
    ],
  },
  {
    heading: "22. Entire Agreement",
    body: "These Terms, together with the Privacy Policy, the Return, Exchange & Refund Policy, the Shipping & Cancellation Policy, and the Legal Disclaimer, constitute the entire agreement between you and Meenazo regarding your use of the Website, and supersede any prior or contemporaneous agreements, communications, or understandings, whether oral or written. Section headings are included for convenience only and do not affect the interpretation of these Terms. Any ambiguity in these Terms shall not be construed against the drafting party.",
  },
  {
    heading: "23. Contact Us",
    body: "You can write to us at care@meenazo.in for any product, purchase, sale, refund, cancellation or shipment related grievances and for any queries regarding these Terms.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      lastUpdated="11 August 2026"
      intro={intro}
      sections={sections}
    />
  );
}
