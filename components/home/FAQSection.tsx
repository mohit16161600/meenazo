import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { Icon } from "@/components/ui/Icon";
import { generalFaq } from "@/data/faq";
import { siteConfig } from "@/data/site";

/**
 * Home FAQ section — sticky intro on the left, accordion of the top
 * questions on the right. Stacks on mobile.
 */
export function FAQSection() {
  return (
    <section className="section-y">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
          {/* Left: sticky intro */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow">Questions?</span>
            <h2 className="mt-1.5">Frequently asked questions</h2>
            <p className="mt-3 text-muted leading-relaxed">
              Everything you need to know about our Ayurvedic formulations, safety,
              shipping and returns. Still curious? Our team is always happy to help.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href="/faq" variant="dark">
                View all FAQs
              </Button>
              <a
                href={`https://wa.me/${siteConfig.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                <Icon name="whatsapp" size={18} /> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Right: accordion */}
          <Accordion items={generalFaq.slice(0, 6)} />
        </div>
      </Container>
    </section>
  );
}
