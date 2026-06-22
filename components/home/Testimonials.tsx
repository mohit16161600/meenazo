import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StarRating } from "@/components/ui/StarRating";
import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  const items = testimonials.slice(0, 6);

  return (
    <section className="section-y">
      <Container>
        <SectionHeader
          eyebrow="Reviews"
          title="What our customers say"
          subtitle="Honest words from people who chose authentic, lab-tested Ayurveda."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.id}
              className="card-surface card-hover flex h-full flex-col rounded-brand p-7 shadow-brand"
            >
              <span className="text-4xl leading-none text-brand-light" aria-hidden>
                “
              </span>

              <StarRating rating={t.rating} size="md" className="mt-1" />

              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">
                {t.quote}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-xl"
                  aria-hidden
                >
                  {t.avatar}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{t.name}</p>
                  <p className="truncate text-xs text-muted">
                    {[t.role, t.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
