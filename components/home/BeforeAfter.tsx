import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { beforeAfter } from "@/data/benefits";

export function BeforeAfter() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          center
          eyebrow="Real results"
          title="Before & after"
          subtitle="Consistent daily use, the Ayurvedic way — here is what real customers experienced."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {beforeAfter.map((item) => (
            <article
              key={item.id}
              className="card-surface card-hover flex h-full flex-col rounded-brand p-5 shadow-brand"
            >
              {/* Before / After panels */}
              <div className="relative grid grid-cols-2 gap-3">
                {/* Before */}
                <div className="relative aspect-square overflow-hidden rounded-brand">
                  <ArtPlaceholder
                    emoji={item.beforeEmoji}
                    gradient={["#f0f2f1", "#e2e7e4"]}
                    src={item.beforeImage}
                    alt={`${item.name} before`}
                    fit="cover"
                    fontSize={48}
                    className="h-full w-full rounded-brand"
                  />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-muted">
                    Before
                  </span>
                </div>

                {/* After */}
                <div className="relative aspect-square overflow-hidden rounded-brand">
                  <ArtPlaceholder
                    emoji={item.afterEmoji}
                    gradient={["#eaf3ee", "#c7e6d4"]}
                    src={item.afterImage}
                    alt={`${item.name} after`}
                    fit="cover"
                    fontSize={48}
                    className="h-full w-full rounded-brand"
                  />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-dark">
                    After
                  </span>
                </div>

                {/* Arrow between panels */}
                <span
                  className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-sm text-white shadow-brand"
                  aria-hidden
                >
                  →
                </span>
              </div>

              {/* Details */}
              <div className="mt-5 flex flex-1 flex-col">
                <h3 className="text-base font-bold text-ink">{item.name}</h3>
                <p className="mt-1 text-sm text-muted">{item.concern}</p>

                <div className="mt-3">
                  <span className="chip chip-soft">⏱ {item.duration}</span>
                </div>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink">
                  {item.result}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs italic text-muted">
          Individual results may vary. These are personal experiences and not a
          substitute for medical advice.
        </p>
      </Container>
    </section>
  );
}
