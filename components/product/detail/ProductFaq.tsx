import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { Accordion } from "@/components/ui/Accordion";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/data/site";
import { generalFaq } from "@/data/faq";

/**
 * Full-width FAQ section with a support card alongside. Like reviews, this used
 * to be a tab; product pages get long FAQ lists so it reads far better as its
 * own band with somewhere to go when the answer isn't listed.
 */
export function ProductFaq({ product }: { product: Product }) {
  const items = product.faq && product.faq.length ? product.faq : generalFaq;
  const wa = siteConfig.whatsapp;

  return (
    <section id="faq" className="bg-soft section-y scroll-mt-24">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Good to know</span>
          <h2 className="mt-2 text-balance">Frequently asked questions</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            Everything people usually ask before adding {product.name} to their routine.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <Reveal from="up">
            <div className="rounded-brand border border-line bg-white p-4 sm:p-6">
              <Accordion items={items} />
            </div>
          </Reveal>

          {/* Still stuck? — give the question somewhere to go. */}
          <Reveal delay={120} from="up">
            <aside className="rounded-brand border border-line bg-white p-6 text-center lg:sticky lg:top-24">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint text-brand"
                aria-hidden
              >
                <Icon name="headset" size={22} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">Still have a question?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Our Ayurveda team answers within a few hours, every day of the week.
              </p>
              <div className="mt-5 space-y-2.5">
                {wa && (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full"
                  >
                    <Icon name="whatsapp" size={18} />
                    Chat on WhatsApp
                  </a>
                )}
                <a href={`mailto:${siteConfig.email}`} className="btn btn-outline w-full">
                  <Icon name="mail" size={18} />
                  Email us
                </a>
              </div>
            </aside>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
