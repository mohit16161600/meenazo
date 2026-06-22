import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { offerBanner } from "@/data/offers";

/** Dark promotional strip highlighting the current store-wide offer. */
export function OfferBanner() {
  return (
    <section>
      <Container>
        <div
          className="relative flex flex-col items-start gap-6 overflow-hidden rounded-brand px-7 py-10 shadow-brand sm:px-10 md:flex-row md:items-center md:justify-between md:py-12 lg:px-14"
          style={{ background: offerBanner.background }}
        >
          {/* Decorative emoji art */}
          <span
            className="pointer-events-none absolute -right-4 -top-6 select-none text-[120px] leading-none opacity-15 sm:text-[160px] md:opacity-20"
            aria-hidden
          >
            {offerBanner.emoji}
          </span>

          <div className="relative max-w-xl">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-light">
              {offerBanner.eyebrow}
            </span>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {offerBanner.title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
              {offerBanner.description}
            </p>
          </div>

          <div className="relative shrink-0">
            <Button href={offerBanner.buttonLink} size="lg">
              {offerBanner.buttonText}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
