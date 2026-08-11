import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Legal Disclaimer",
  description:
    "Meenazo's authoritative health, medical, and general-use disclaimer for its Ayurvedic and herbal wellness products and this website.",
  path: "/disclaimer",
});

const intro =
  "This Legal Disclaimer is Meenazo Private Limited's (“Meenazo”, “we”, “us”, “our”) authoritative health, medical, and general-use disclaimer for its products and this website, www.meenazo.com, and any third-party platform on which Meenazo’s products are listed (together, the “Site”). It applies wherever it is displayed or referenced, including in our Terms of Use and our Return, Exchange & Refund Policy, both of which incorporate this Disclaimer by reference. By purchasing or using a product of Meenazo, or by accessing the Site, you acknowledge and agree to the terms of this Disclaimer.";

/** Supplied verbatim by the company — do not paraphrase or re-order clauses. */
const sections: LegalSection[] = [
  {
    heading: "1. Nature of Our Products",
    body: "The Ayurvedic and herbal wellness products offered by Meenazo are formulated using traditional knowledge and natural ingredients to support overall well-being. These products are not intended to diagnose, treat, cure, or prevent any disease. They are manufactured in accordance with the Drugs and Cosmetics Act, 1940 and the rules made thereunder, under AYUSH / State Licensing Authority licence number 821/AY-PB. Our advertisements, promotional materials, and marketing content are intended solely to introduce our products and their traditional uses, and do not constitute medical advice, a diagnosis, or a guarantee of any particular outcome or result. No advertisement or promotional statement issued by Meenazo should be relied upon as a substitute for the product label, this Disclaimer, or consultation with a qualified medical practitioner.",
  },
  {
    heading: "2. Buyer Discretion, Age, and Medical Supervision",
    body: [
      "Our products are intended for adult use. Individuals under 18 years of age should use our products only under the supervision of, and following purchase by, a parent or lawful guardian, in accordance with our Terms of Use. We strongly recommend that you consult a qualified medical practitioner before using any of Meenazo’s product, particularly if you are pregnant or breastfeeding, have a pre-existing health condition, are taking any medication, or intend to use a product for or on behalf of a minor. Results may vary from individual to individual, and no product outcome described on the Site should be taken as typical or guaranteed.",
      "You should not rely solely on content available on the Site, or on any third-party platform on which Meenazo’s products are listed, to make health-related decisions, to delay seeking medical advice, or to discontinue any prescribed treatment. Please do not treat any information on the Site as “medical advice”; the Site is not a substitute for consultation with a doctor or other qualified medical practitioner.",
      "Any testimonials, reviews, before-and-after images, or other customer experiences displayed on the Site, whether submitted by customers or featured in our marketing and promotional materials, reflect the personal experience of the individual concerned and are not indicative of, and should not be construed as, typical, guaranteed, or expected results for any other person. Individual results vary based on factors including body constitution, lifestyle, dosage, and consistency of use, and Meenazo makes no representation or warranty that any other user will achieve similar results.",
      "Before using any of Meenazo’s product, please carefully review the list of ingredients printed on the product packaging, particularly if you have a known allergy or sensitivity to any specific herb, plant-based ingredient, or other substance. If you experience any allergic reaction, irritation, or discomfort during or after use, discontinue use of the product immediately.",
      "If you experience any unexpected, adverse, or severe reaction while using any of Meenazo’s product, please stop using the product immediately and (i) consult a qualified healthcare professional promptly, and (ii) report the reaction to us at care@meenazo.in, with details of the product, batch number, and the nature of the reaction, so that we may investigate and take appropriate action. This reporting request is in addition to, and does not affect, any rights you may have under our Return, Exchange & Refund Policy.",
    ],
  },
  {
    heading: "3. Storage Instructions",
    body: [
      "Unless otherwise stated on the product label, our products should be stored in a cool, dry place, away from direct sunlight and moisture, and kept out of the reach of children. Improper storage may affect product quality and efficacy, and Meenazo shall not be liable for any consequence arising from storage contrary to these instructions or the instructions on the product label.",
      "Because our products are formulated using natural, herbal, and Ayurvedic ingredients, minor variations in colour, smell, taste, or appearance may occur between batches. Such variation is a natural characteristic of plant-based formulations and does not indicate a defect, and does not by itself affect the quality, safety, or efficacy of the product.",
    ],
  },
  {
    heading: "4. Limitation of Liability",
    body: [
      "Your use of and browsing of the Site is at your own risk. You should not rely solely on any material on the Site, and should seek independent professional opinion before taking, or deciding not to take, any action that could lead to injury, harm, or damage of any kind. Under no circumstances shall we be liable for any loss or damage whatsoever — whether in contract, tort, or otherwise — arising from your use of, or reliance on, the material on the Site, or from your use of the internet generally.",
      "For the purposes of this Section, “we” includes Meenazo Private Limited and its respective employees, directors, partners, agents, and representatives, and any third-party providers or sources of information or data appearing on the Site.",
      "Meenazo will not be liable for any direct or indirect consequence arising from the use of our products without proper medical consultation, or from use of a product contrary to its recommended instructions or label. Meenazo shall further not be liable for any consequence arising from consumption of the product beyond its indicated shelf life or expiry date, including where such product has been stocked or stored by the customer prior to use. By purchasing and using our products, you acknowledge and accept the terms of this Disclaimer.",
      "If you are dissatisfied with the Site or any material on it for any reason, or believe you have been harmed or injured by any material contained on the Site, your sole and exclusive remedy is to discontinue accessing and using the Site. This Section does not exclude or limit any liability that cannot lawfully be excluded or limited under applicable Indian law, including your rights as a consumer under the Consumer Protection Act, 2019, and our obligations under our Return, Exchange & Refund Policy in respect of defective or wrongly delivered products.",
    ],
  },
  {
    heading: "5. Third-Party Links",
    body: "Links provided on the Site to other websites are included for your convenience only. We do not warrant, and are not responsible for, the information, products, or services available on or through such third-party websites, or any related person, business, or service.",
  },
  {
    heading: "6. Governing Law and Jurisdiction",
    body: "This Disclaimer is governed by, and construed and enforced in accordance with, the laws of India, and the courts at Delhi shall have exclusive jurisdiction over any matter arising out of or relating to it. Together with our Terms of Use, our Privacy Policy, our Return, Exchange & Refund Policy, and our Shipping & Cancellation Policy, this Disclaimer constitutes the entire agreement between you and Meenazo on the matters addressed in it.",
  },
  {
    heading: "7. Contact Us",
    body: "For more queries regarding this, please write to us at care@meenazo.in.",
  },
];

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Legal Disclaimer"
      lastUpdated="11 August 2026"
      intro={intro}
      sections={sections}
    />
  );
}
