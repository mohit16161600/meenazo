import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Emblem } from "@/components/ui/Emblem";
import { Button } from "@/components/ui/Button";
import { whyChooseUs } from "@/data/benefits";
import { cn } from "@/utils/cn";

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
          {/* Intro / promise — the page's one dark panel, so the eye lands here */}
          <div className="relative overflow-hidden rounded-brand bg-brand-dark p-7 text-white shadow-brand-lg sm:p-9 lg:col-span-5 lg:sticky lg:top-28">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-white/5 blur-2xl"
            />

            <div className="relative">
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/70">
                Why Meenazo
              </span>
              <h2 className="mt-2 text-balance !text-white">
                Wellness you can <span className="script !text-gold">actually</span> trust
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
                Every Meenazo formula is held to a higher standard — from the herbs we source to the
                labs that test them. No shortcuts, no nasties, no empty claims.
              </p>

              <ul className="mt-7 space-y-3">
                {proofPoints.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                    <span
                      className="grid h-6 w-6 flex-none place-items-center rounded-full bg-white/15"
                      aria-hidden
                    >
                      <Icon name="check" size={13} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button href="/shop" className="!bg-white !text-brand-dark hover:!bg-mint">
                  Shop the range
                </Button>
              </div>
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
                    <Emblem
                      image={item.image}
                      icon={item.icon}
                      iconSize={22}
                      rounded="rounded-xl"
                      className={cn(
                        "h-12 w-12 transition-colors duration-200",
                        // an uploaded image keeps its own colours; the icon inverts
                        !item.image && "group-hover:bg-brand group-hover:text-white"
                      )}
                    />
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
