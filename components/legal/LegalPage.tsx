import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";

export interface LegalSection {
  heading: string;
  /** A single paragraph, or an array rendered as multiple paragraphs. */
  body: string | string[];
}

/**
 * Reusable layout for legal & policy pages. Renders a PageHero followed by a
 * readable, narrow prose column where each section becomes an h2 with one or
 * more body paragraphs. Calm spacing, comfortable line length.
 */
export function LegalPage({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated?: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero
        eyebrow="Legal & policies"
        title={title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]}
      />

      <section className="section-y">
        <Container>
          <div className="max-w-3xl">
            {lastUpdated && (
              <p className="text-sm text-muted mb-10">
                <span className="font-medium text-ink">Last updated:</span> {lastUpdated}
              </p>
            )}

            <div className="space-y-10">
              {sections.map((section, i) => {
                const paragraphs = Array.isArray(section.body) ? section.body : [section.body];
                return (
                  <div key={i} className="scroll-mt-28">
                    <h2 className="text-xl md:text-2xl font-bold text-ink">
                      {section.heading}
                    </h2>
                    <div className="mt-3 space-y-4">
                      {paragraphs.map((p, j) => (
                        <p key={j} className="text-muted leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
