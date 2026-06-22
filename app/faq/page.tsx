import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/layout/PageHero";
import { generalFaq } from "@/data/faq";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about Meenazo's authentic Ayurvedic products — safety, results, delivery, returns and more.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <>
      <PageHero
        eyebrow="Help centre"
        title="Frequently asked questions"
        subtitle="Everything you need to know about our products, ordering and Ayurveda in general. Can't find your answer? Our team is just a message away."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <section className="section-y">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-ink">Common questions</h2>
            <p className="mt-2 text-muted">
              Browse the most-asked questions from our community below.
            </p>
            <Accordion items={generalFaq} className="mt-7" />

            {/* Still have questions CTA */}
            <div className="mt-12 rounded-brand bg-soft p-8 text-center md:p-10">
              <span className="text-4xl" aria-hidden>
                🌿
              </span>
              <h3 className="mt-3 text-xl font-bold text-ink">Still have questions?</h3>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Our qualified Ayurvedic advisors are happy to guide you — free and with no
                obligation. Reach out however suits you best.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  <Icon name="whatsapp" size={18} /> Chat on WhatsApp
                </a>
                <Button href="/contact" variant="ghost">
                  Contact our team
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
