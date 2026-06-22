import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

/**
 * Reusable inner-page hero — a calm bg-soft band with optional breadcrumbs,
 * an eyebrow, a large h1 title and a supporting subtitle. Used at the top of
 * static & legal pages for a consistent, premium first impression.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <section className="bg-soft border-b border-line">
      <Container className="py-12 md:py-16">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} className="mb-5" />
        )}
        <div className="max-w-3xl animate-slideUp">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="mt-2 text-3xl md:text-[40px] leading-tight font-bold text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base md:text-lg leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
