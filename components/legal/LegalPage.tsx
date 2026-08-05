import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";

/**
 * One block inside a section: a plain string becomes a paragraph, while
 * `{ list: [...] }` becomes a bulleted list. Policy text mixes the two freely
 * (a lead-in sentence, the bullets, then a closing sentence).
 */
export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  heading: string;
  /** A single paragraph, or an array of paragraphs and bulleted lists. */
  body: string | LegalBlock[];
}

/**
 * Reusable layout for legal & policy pages. Renders a PageHero followed by a
 * readable, narrow prose column where each section becomes an h2 with one or
 * more body paragraphs. Calm spacing, comfortable line length.
 */
export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  lastUpdated?: string;
  /** Lead paragraph(s) shown above the numbered sections. */
  intro?: string | string[];
  sections: LegalSection[];
}) {
  const leads = intro === undefined ? [] : Array.isArray(intro) ? intro : [intro];
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

            {leads.length > 0 && (
              <div className="mb-10 space-y-4 rounded-brand border border-line bg-soft p-6">
                {leads.map((p, i) => (
                  <p key={i} className="text-muted leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-10">
              {sections.map((section, i) => {
                const blocks = Array.isArray(section.body) ? section.body : [section.body];
                return (
                  <div key={i} className="scroll-mt-28">
                    <h2 className="text-xl md:text-2xl font-bold text-ink">
                      {section.heading}
                    </h2>
                    <div className="mt-3 space-y-4">
                      {blocks.map((block, j) =>
                        typeof block === "string" ? (
                          <p key={j} className="text-muted leading-relaxed">
                            {block}
                          </p>
                        ) : (
                          <ul key={j} className="space-y-2 pl-1">
                            {block.list.map((item, k) => (
                              <li key={k} className="flex gap-3 text-muted leading-relaxed">
                                <span
                                  aria-hidden="true"
                                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )
                      )}
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
