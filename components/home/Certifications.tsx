import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { certifications } from "@/data/trust";

/**
 * Grid of quality certifications — reassures shoppers the products are
 * GMP / ISO / AYUSH certified and lab-tested. 6 across on desktop.
 */
export function Certifications() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          center
          eyebrow="Quality you can trust"
          title="Certified & lab-tested"
          subtitle="Every Meenazo formula is made in certified facilities and independently verified for purity and potency."
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="card-surface flex flex-col items-center gap-2 px-4 py-6 text-center transition-shadow hover:shadow-brand"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-brand" aria-hidden>
                <Icon name={cert.icon} size={26} />
              </span>
              <h3 className="font-semibold text-ink leading-tight">{cert.name}</h3>
              <p className="text-xs text-muted leading-snug">{cert.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
