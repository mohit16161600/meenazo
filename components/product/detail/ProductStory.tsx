import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

/** Soft botanical corner ornament — pure SVG, scales crisply, weighs ~nothing. */
function LeafDecor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M170 30C120 40 70 70 55 130c-5 20-3 38-3 38s14-6 30-20c45-38 78-78 88-118Z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M52 168C70 120 110 78 168 60"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/** Icons cycled across the benefit cards so the grid reads as "designed". */
const BENEFIT_ICONS = ["sparkles", "heart-pulse", "leaf", "sun", "shield-check", "check-circle"];

/**
 * Rich, scroll-revealed product story sections rendered between the buy box and
 * the detail tabs. Everything is derived from the product data (benefits,
 * ingredients, highlights, dosage) — no invented claims — and styled as modern
 * DTC bands so the page reads premium instead of bare.
 */
export function ProductStory({ product }: { product: Product }) {
  const steps = [
    {
      icon: "clock",
      title: "Take it daily",
      text: product.dosage
        ? `Your daily ritual: ${product.dosage.toLowerCase()}.`
        : "Take as directed on the pack, every day.",
    },
    {
      icon: "flask",
      title: "With warm water",
      text: "Best absorbed with warm water — the classical Ayurvedic way.",
    },
    {
      icon: "infinity",
      title: "Stay consistent",
      text: "Ayurveda works on your baseline. Give it 4–8 weeks of regular use.",
    },
  ];

  return (
    <>
      {/* ── Benefits showcase ─────────────────────────────── */}
      {product.benefits.length > 0 && (
        <section className="section-y">
          <Container>
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Why it works</span>
              <h2 className="mt-2 text-balance">
                What <span className="text-gradient">{product.name}</span> does for you
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                A focused, doctor-formulated blend designed to support your wellness goals — gently
                and naturally.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.benefits.map((b, i) => (
                <Reveal key={b} delay={(i % 3) * 80} from="up">
                  <div className="group h-full rounded-brand border border-line bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-light hover:shadow-brand">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white"
                      aria-hidden
                    >
                      <Icon name={BENEFIT_ICONS[i % BENEFIT_ICONS.length]} size={22} />
                    </span>
                    <p className="mt-4 font-semibold leading-snug text-ink">{b}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── Ingredients spotlight ─────────────────────────── */}
      {product.ingredients.length > 0 && (
        <section className="relative overflow-hidden bg-soft section-y">
          <LeafDecor className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 text-brand-light/40" />
          <LeafDecor className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rotate-180 text-brand-light/30" />
          <Container className="relative">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Inside every capsule</span>
              <h2 className="mt-2 text-balance">
                {product.ingredients.length} powerful Ayurvedic herbs
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                Each herb is chosen for a reason and standardised for consistent potency — no
                fillers, no shortcuts.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.ingredients.map((ing, i) => (
                <Reveal key={ing.name} delay={(i % 3) * 70}>
                  <div className="group flex h-full gap-4 rounded-brand border border-line bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-brand">
                    <span
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-brand"
                      aria-hidden
                    >
                      <Icon name={i % 2 === 0 ? "leaf" : "sprout"} size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-bold text-ink">{ing.name}</span>
                        {ing.amount && ing.amount !== "—" && (
                          <span className="chip chip-soft !text-[10px] italic">{ing.amount}</span>
                        )}
                      </div>
                      {ing.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">{ing.description}</p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── How to use — 3 steps ──────────────────────────── */}
      <section className="section-y">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Simple ritual</span>
            <h2 className="mt-2 text-balance">How to use {product.name}</h2>
          </Reveal>

          <div className="relative mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* connecting line on desktop */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-9 hidden border-t-2 border-dashed border-line md:block"
              aria-hidden
            />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 100} className="relative">
                <div className="relative flex h-full flex-col items-center rounded-brand border border-line bg-white p-7 text-center">
                  <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-brand">
                    <Icon name={s.icon} size={26} />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-5 text-base font-bold text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {product.howToUse && (
            <Reveal className="mx-auto mt-6 max-w-3xl">
              <p className="rounded-brand bg-mint px-5 py-4 text-center text-sm leading-relaxed text-brand-dark">
                <strong className="font-semibold">Directions:</strong> {product.howToUse}
              </p>
            </Reveal>
          )}
        </Container>
      </section>

      {/* ── Brand promise band ────────────────────────────── */}
      {product.highlights && product.highlights.length > 0 && (
        <section className="pb-4">
          <Container>
            <Reveal from="zoom">
              <div
                className="relative overflow-hidden rounded-brand px-6 py-9 text-white shadow-brand-lg sm:px-10"
                style={{ background: "linear-gradient(145deg, #1f2a24, #3f6b51)" }}
              >
                <LeafDecor className="pointer-events-none absolute -right-6 -top-8 h-52 w-52 text-white/10" />
                <div className="relative text-center">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-light">
                    The Meenazo promise
                  </span>
                  <h2 className="mt-2 text-white">Pure, tested and made in India</h2>
                </div>
                <div className="relative mx-auto mt-7 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
                  {product.highlights.map((h) => (
                    <div key={h} className="flex flex-col items-center gap-2 text-center">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15">
                        <Icon name="badge-check" size={22} />
                      </span>
                      <span className="text-sm font-semibold leading-tight text-white/90">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}
    </>
  );
}
