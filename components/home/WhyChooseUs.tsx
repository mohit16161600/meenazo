import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { whyChooseUs } from "@/data/benefits";

/** Honest, verifiable proof points shown as chips beside the heading. */
const proofPoints = ["WHO-GMP", "ISO 9001", "AYUSH", "FSSAI", "Lab-tested"];

/**
 * Home "Why Meenazo" band — an editorial two-column layout: a sticky intro on
 * the left (heading, promise, certification chips, CTA) and a numbered grid of
 * trust cards on the right with an animated top-accent on hover.
 */
export function WhyChooseUs() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Intro / promise */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <span className="eyebrow">Why Meenazo</span>
            <h2 className="mt-2 text-balance">
              Wellness you can <span className="text-brand">actually</span> trust
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Every Meenazo formula is held to a higher standard — from the herbs we source
              to the labs that test them. No shortcuts, no nasties, no empty claims.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {proofPoints.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <Icon name="badge-check" size={14} className="text-brand" />
                  {p}
                </span>
              ))}
            </div>

            <div className="mt-8">
              <Button href="/shop">Shop the range</Button>
            </div>
          </div>

          {/* Trust cards */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {whyChooseUs.map((item, i) => (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-brand border border-line bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-light hover:shadow-brand"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white"
                      aria-hidden
                    >
                      <Icon name={item.icon} size={22} />
                    </span>
                    <span className="text-sm font-extrabold tabular-nums text-line transition-colors group-hover:text-brand-light">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
