import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ayurvedicBenefits } from "@/data/benefits";

/**
 * Home "Ayurvedic way" section — a calm two-column layout.
 * Left: an editorial intro about the 5,000-year science with a CTA to /about.
 * Right: a 2×2 grid of benefit cards (emoji, title, description).
 */
export function AyurvedicBenefits() {
  return (
    <section className="section-y">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Intro */}
          <div className="max-w-xl">
            <span className="eyebrow">The Ayurvedic way</span>
            <h2 className="mt-2">Ancient wisdom, made for modern life</h2>
            <p className="mt-4 text-muted leading-relaxed">
              Ayurveda is a 5,000-year-old science of life that looks beyond
              symptoms to restore your body&apos;s natural balance. Rather than
              quick fixes, it works gently with your unique constitution — pairing
              time-tested herbs with mindful daily rituals.
            </p>
            <p className="mt-4 text-muted leading-relaxed">
              At Meenazo, we honour that tradition while holding every formula to
              rigorous modern standards, so you get the best of both worlds.
            </p>
            <div className="mt-7">
              <Button variant="ghost" href="/about">
                Discover our philosophy
              </Button>
            </div>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            {ayurvedicBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="card-surface card-hover p-6 sm:p-7 bg-soft"
              >
                <span
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-mint text-brand"
                  aria-hidden
                >
                  <Icon name={benefit.icon} size={24} />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
