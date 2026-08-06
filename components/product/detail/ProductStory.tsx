import Image from "next/image";
import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/utils/cn";

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

/** Icons cycled across the benefit cards when no artwork has been uploaded. */
const BENEFIT_ICONS = ["sparkles", "heart-pulse", "leaf", "sun", "shield-check", "check-circle"];
/** Same idea for the ritual steps, in the order the steps are listed. */
const STEP_ICONS = ["clock", "flask", "infinity", "sun"];

/**
 * Cards sit in a centred flex-wrap rather than a grid so a row that doesn't
 * divide evenly (4 across 3 columns, 7 herbs across 3) centres its remainder
 * instead of leaving a lonely card hanging on the left.
 */
const CARD_3_UP = "w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]";

export function ProductStory({ product }: { product: Product }) {
  // Product-specific steps when the copy provides them, generic ones otherwise.
  const steps =
    product.howToUseSteps && product.howToUseSteps.length > 0
      ? product.howToUseSteps
      : [
          {
            title: "Take it daily",
            description: product.dosage
              ? `Your daily ritual: ${product.dosage.toLowerCase()}.`
              : "Take as directed on the pack, every day.",
            image: undefined,
          },
          {
            title: "With warm water",
            description: "Best absorbed with warm water — the classical Ayurvedic way.",
            image: undefined,
          },
          {
            title: "Stay consistent",
            description: "Ayurveda works on your baseline. Give it 4–8 weeks of regular use.",
            image: undefined,
          },
        ];

  // Same fallback idea for the benefit cards: rich copy when written, plain
  // benefit lines otherwise, so every product renders this band.
  const benefitCards =
    product.benefitDetails && product.benefitDetails.length > 0
      ? product.benefitDetails
      : product.benefits.map((b) => ({ title: b, description: "", image: undefined }));

  const comparisonRows = (product.comparison ?? []).filter((r) => r.ours || r.others);

  return (
    <>
      {/* ── Benefits showcase ─────────────────────────────── */}
      {benefitCards.length > 0 && (
        <section className="section-y">
          <Container>
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Why it works</span>
              <h2 className="mt-2 text-balance">
                What <span className="text-gradient">{product.name}</span> does for you
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                {product.benefitsHeadline ??
                  "A focused, doctor-formulated blend designed to support your wellness goals — gently and naturally."}
              </p>
            </Reveal>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              {benefitCards.map((b, i) => (
                <Reveal key={b.title} delay={(i % 3) * 80} from="up" className={CARD_3_UP}>
                  <article className="group relative h-full overflow-hidden rounded-brand border border-line bg-white p-7 pt-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-light hover:shadow-brand-lg">
                    {/* mint wash that grows on hover — keeps the card alive without a heavy border */}
                    <span
                      className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-mint opacity-60 transition-transform duration-500 group-hover:scale-150"
                      aria-hidden
                    />
                    {/* oversized step numeral, watermark style */}
                    <span
                      className="pointer-events-none absolute right-5 top-3 text-5xl font-extrabold leading-none text-ink/[0.06] transition-colors duration-300 group-hover:text-brand/15"
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="relative">
                      {/* Fixed-size art slot: the icon placeholder occupies exactly
                          the space an uploaded illustration will, so dropping one
                          in later never reflows the card. */}
                      <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-line transition-transform duration-300 group-hover:scale-105">
                        {b.image ? (
                          <Image
                            src={b.image}
                            alt={b.title}
                            width={160}
                            height={160}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span
                            className="flex h-full w-full items-center justify-center rounded-xl bg-brand text-white"
                            aria-hidden
                          >
                            <Icon name={BENEFIT_ICONS[i % BENEFIT_ICONS.length]} size={26} />
                          </span>
                        )}
                      </span>

                      <h3 className="mt-5 text-[17px] font-bold leading-snug text-ink">{b.title}</h3>
                      {b.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted">{b.description}</p>
                      )}

                      {/* accent rule that draws out on hover */}
                      <span
                        className="mt-5 block h-[3px] w-10 rounded-full bg-brand-light transition-all duration-300 group-hover:w-20 group-hover:bg-brand"
                        aria-hidden
                      />
                    </div>
                  </article>
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

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              {product.ingredients.map((ing, i) => (
                <Reveal key={ing.name} delay={(i % 3) * 70} className={CARD_3_UP}>
                  <article className="group h-full overflow-hidden rounded-brand border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-light hover:shadow-brand-lg">
                    {/* Photo band — always rendered so the herb picture has its
                        place waiting; until one is added it holds a botanical
                        placeholder instead of collapsing the card. */}
                    <span className="relative block aspect-[16/10] w-full overflow-hidden bg-mint">
                      {ing.image ? (
                        <Image
                          src={ing.image}
                          alt={ing.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span
                          className="flex h-full w-full items-center justify-center text-brand/35"
                          aria-hidden
                        >
                          <Icon name={i % 2 === 0 ? "leaf" : "sprout"} size={46} />
                        </span>
                      )}
                      <span
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        aria-hidden
                      />
                    </span>

                    <div className="p-6 pt-5">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h3 className="text-[17px] font-bold text-ink">{ing.name}</h3>
                        {ing.amount && ing.amount !== "—" && (
                          <span className="chip chip-soft !text-[10px] italic">{ing.amount}</span>
                        )}
                      </div>
                      {ing.description && (
                        <p className="mt-2.5 text-sm leading-relaxed text-muted">{ing.description}</p>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── How to use — numbered ritual ──────────────────── */}
      <section className="section-y">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Simple ritual</span>
            <h2 className="mt-2 text-balance">How to use {product.name}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
              {product.howToUseHeadline ??
                "Three small habits — that's the whole routine."}
            </p>
          </Reveal>

          <div className="relative mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* connector that runs behind the cards on desktop */}
            <div
              className="pointer-events-none absolute inset-x-[16%] top-[4.5rem] hidden border-t-2 border-dashed border-brand-light md:block"
              aria-hidden
            />

            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 110} className="relative">
                <article className="group relative flex h-full flex-col items-center rounded-brand border border-line bg-white px-6 pb-8 pt-9 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-light hover:shadow-brand-lg">
                  {/* step chip sitting on the card's top edge */}
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Step {i + 1}
                  </span>

                  {/* Same fixed art slot as the benefit cards — the placeholder
                      and a real photo occupy identical space. */}
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mint ring-4 ring-mint/60 transition-transform duration-300 group-hover:scale-105">
                    {s.image ? (
                      <Image
                        src={s.image}
                        alt={s.title}
                        width={192}
                        height={192}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center rounded-full bg-brand text-white"
                        aria-hidden
                      >
                        <Icon name={STEP_ICONS[i % STEP_ICONS.length]} size={32} />
                      </span>
                    )}
                  </span>

                  <h3 className="mt-6 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                </article>
              </Reveal>
            ))}
          </div>

          {product.howToUse && (
            <Reveal className="mx-auto mt-8 max-w-3xl">
              <div className="flex items-start gap-4 rounded-brand border border-brand-light/60 bg-mint px-6 py-5">
                <span
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand"
                  aria-hidden
                >
                  <Icon name="clipboard-check" size={18} />
                </span>
                <p className="text-sm leading-relaxed text-brand-dark">
                  <strong className="font-bold">Directions:</strong> {product.howToUse}
                </p>
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {/* ── Why it's different — two facing columns ────────── */}
      {comparisonRows.length > 0 && (
        <section className="relative overflow-hidden bg-soft section-y">
          <LeafDecor className="pointer-events-none absolute -left-16 top-8 h-56 w-56 text-brand-light/25" />
          <Container className="relative">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">The difference</span>
              <h2 className="mt-2 text-balance">
                Why choose <span className="text-gradient">{product.name}</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                The same shelf, two very different bottles. Here's what sets ours apart.
              </p>
            </Reveal>

            <Reveal className="relative mx-auto mt-12 max-w-4xl" from="up">
              {/* VS medallion straddling the two columns on desktop */}
              <span
                className="absolute left-1/2 top-1/2 z-20 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-soft bg-ink text-sm font-extrabold uppercase tracking-wider text-white md:flex"
                aria-hidden
              >
                vs
              </span>

              <div className="grid gap-5 md:grid-cols-2 md:gap-8">
                {/* ---- Ours: raised, branded, confident ---- */}
                <div className="relative overflow-hidden rounded-brand bg-white shadow-brand-lg ring-2 ring-brand md:-translate-y-2">
                  <div
                    className="px-6 py-5 text-center text-white"
                    style={{ background: "linear-gradient(135deg, #3f6b51, #1f2a24)" }}
                  >
                    <span className="inline-flex items-center gap-2 text-base font-bold sm:text-lg">
                      <Icon name="badge-check" size={20} />
                      {product.name}
                    </span>
                  </div>
                  <ul className="divide-y divide-line">
                    {comparisonRows.map((row) => (
                      <li key={`ours-${row.ours}`} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                        <span
                          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white"
                          aria-hidden
                        >
                          <Icon name="check" size={14} />
                        </span>
                        <span className="text-[15px] font-semibold leading-snug text-ink">
                          {row.ours}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ---- Theirs: flat, muted, deliberately dull ---- */}
                <div className="relative overflow-hidden rounded-brand border border-line bg-white/70">
                  <div className="border-b border-line bg-slate-100 px-6 py-5 text-center">
                    <span className="text-base font-bold text-slate-500 sm:text-lg">
                      Other products
                    </span>
                  </div>
                  <ul className="divide-y divide-line">
                    {comparisonRows.map((row) => (
                      <li
                        key={`theirs-${row.others}`}
                        className="flex items-start gap-3 px-5 py-4 sm:px-6"
                      >
                        <span
                          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500"
                          aria-hidden
                        >
                          <Icon name="close" size={14} />
                        </span>
                        <span className="text-[15px] leading-snug text-muted">{row.others}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      {/* ── Brand promise band ────────────────────────────── */}
      {product.highlights && product.highlights.length > 0 && (
        <section className="pb-4 pt-14 md:pt-16">
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
