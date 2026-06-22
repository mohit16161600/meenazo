import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { PageHero } from "@/components/layout/PageHero";
import { doctorInfo, certifications } from "@/data/trust";
import { ayurvedicBenefits, whyChooseUs } from "@/data/benefits";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Discover the story behind Meenazo — authentic, lab-tested Ayurvedic formulations crafted by qualified BAMS doctors, blending 5,000 years of tradition with modern science.",
  path: "/about",
});

const stats = [
  { value: "50,000+", label: "Happy customers" },
  { value: "100%", label: "Lab tested" },
  { value: "8", label: "Health categories" },
  { value: "15 yrs", label: "Ayurvedic expertise" },
];

const processSteps = [
  {
    step: "01",
    icon: "🌱",
    title: "Ethical sourcing",
    description:
      "We hand-select single-origin herbs from trusted Indian farms, ensuring full traceability from soil to shelf.",
  },
  {
    step: "02",
    icon: "👩‍⚕️",
    title: "Doctor formulation",
    description:
      "Our BAMS Ayurvedic physicians design every formula using classical texts and standardised, research-backed extracts.",
  },
  {
    step: "03",
    icon: "🏭",
    title: "GMP manufacturing",
    description:
      "Each batch is produced in WHO-GMP and ISO certified facilities under strict quality controls — no shortcuts.",
  },
  {
    step: "04",
    icon: "🔬",
    title: "Third-party testing",
    description:
      "Independent labs verify purity, potency and heavy-metal safety before any product reaches your home.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Ancient Ayurveda, crafted for modern life"
        subtitle="Meenazo was born from a simple belief — that the timeless wisdom of Ayurveda deserves the rigour of modern science. We make authentic herbal wellness that you can actually trust."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      {/* Brand story */}
      <section className="section-y">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <span className="eyebrow">Where it began</span>
              <h2 className="mt-1.5">A return to roots, without compromise</h2>
              <div className="mt-5 space-y-4 text-muted leading-relaxed">
                <p>
                  Meenazo started with a frustration shared by our founders — the Ayurvedic
                  shelf was crowded with vague promises, untested ingredients and formulations
                  that bore little resemblance to the classical recipes they claimed to honour.
                </p>
                <p>
                  We set out to do it differently. Working alongside experienced BAMS physicians,
                  we built a range of formulations grounded in authentic Ayurvedic texts and
                  validated by modern lab testing. No fillers, no inflated claims — just genuine
                  herbs, standardised for consistency and made to a clinical standard.
                </p>
                <p>
                  Today, {siteConfig.name} helps tens of thousands of families across India
                  bring balance back to everyday wellbeing — from immunity and metabolism to
                  men&apos;s and women&apos;s health — the gentle, root-cause way Ayurveda intended.
                </p>
              </div>
            </div>
            <ArtPlaceholder
              emoji="🌿"
              gradient={["#eaf3ee", "#a8d7bd"]}
              className="aspect-[4/3] w-full rounded-brand shadow-brand"
            />
          </div>
        </Container>
      </section>

      {/* Stats row */}
      <section className="bg-brand-dark py-14 md:py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold text-white">{s.value}</div>
                <div className="mt-2 text-sm text-brand-light">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="section-y bg-soft">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Our mission</span>
            <h2 className="mt-1.5">Wellness rooted in trust</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              To make authentic Ayurveda accessible, transparent and genuinely effective — so
              every household can choose natural wellness with complete confidence. We measure
              success not in sales, but in the trust our customers place in every bottle.
            </p>
          </div>
        </Container>
      </section>

      {/* Ayurvedic philosophy */}
      <section className="section-y">
        <Container>
          <SectionHeader
            center
            eyebrow="Our philosophy"
            title="The Ayurvedic way of healing"
            subtitle="Ayurveda is a 5,000-year-old science of life. Rather than chasing symptoms, it restores balance from within — and that principle guides everything we make."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ayurvedicBenefits.map((b) => (
              <div key={b.title} className="card-surface p-6 text-center">
                <div className="text-4xl" aria-hidden>
                  {b.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our process */}
      <section className="section-y bg-soft">
        <Container>
          <SectionHeader
            center
            eyebrow="Our process"
            title="From farm to formula"
            subtitle="Every Meenazo product passes through four uncompromising stages before it earns a place in your routine."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((p) => (
              <div key={p.step} className="card-surface p-6">
                <div className="flex items-center justify-between">
                  <span className="text-3xl" aria-hidden>
                    {p.icon}
                  </span>
                  <span className="text-2xl font-bold text-brand-light">{p.step}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why choose us */}
      <section className="section-y">
        <Container>
          <SectionHeader
            center
            eyebrow="Why Meenazo"
            title="What makes us different"
            subtitle="Standards we refuse to compromise on — because your wellbeing deserves nothing less."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseUs.map((b) => (
              <div key={b.title} className="card-surface p-6">
                <div className="text-4xl" aria-hidden>
                  {b.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* The doctor */}
      <section className="section-y bg-soft">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:items-center lg:gap-14">
            <ArtPlaceholder
              emoji={doctorInfo.avatar}
              gradient={["#eaf3ee", "#cfe6d8"]}
              className="aspect-square w-full max-w-[280px] rounded-brand shadow-brand"
            />
            <div>
              <span className="eyebrow">{doctorInfo.eyebrow}</span>
              <h2 className="mt-1.5">{doctorInfo.heading}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-lg font-semibold text-ink">{doctorInfo.name}</span>
                <span className="chip chip-soft">{doctorInfo.experience}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-brand">{doctorInfo.title}</p>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted">{doctorInfo.bio}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Certifications */}
      <section id="certifications" className="section-y scroll-mt-24">
        <Container>
          <SectionHeader
            center
            eyebrow="Certifications"
            title="Verified, certified, trusted"
            subtitle="Independent accreditations that back up every claim on our label."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {certifications.map((c) => (
              <div
                key={c.id}
                className="card-surface flex flex-col items-center p-5 text-center"
              >
                <div className="text-3xl" aria-hidden>
                  {c.icon}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{c.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{c.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="section-y bg-soft">
        <Container>
          <div className="rounded-brand bg-brand-dark px-6 py-12 text-center shadow-brand-lg md:px-12 md:py-16">
            <span className="eyebrow text-brand-light">Start your journey</span>
            <h2 className="mt-2 text-white">Find your perfect Ayurvedic ritual</h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-white/85">
              Explore doctor-formulated, lab-tested formulas crafted for real, lasting wellbeing.
            </p>
            <div className="mt-7 flex justify-center">
              <Button href="/shop" size="lg" className="bg-white text-brand-dark hover:bg-mint">
                Shop all products
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
