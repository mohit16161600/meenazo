import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewsBlock } from "./ReviewsBlock";

/**
 * Full-width reviews section. Reviews used to be one tab among six, which
 * buried the strongest social proof on the page behind a click — they now get
 * their own band, and keep the `#reviews` anchor the buy box links to.
 */
export function ProductReviews({ product }: { product: Product }) {
  const count = product.reviews?.length ?? 0;

  return (
    <section id="reviews" className="section-y scroll-mt-24">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Real people, real routines</span>
          <h2 className="mt-2 text-balance">
            What customers say about <span className="text-gradient">{product.name}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            {count > 0
              ? "Unfiltered feedback from verified buyers who made it part of their daily ritual."
              : "Be the first to tell others how this formula worked for you."}
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-10 max-w-4xl" from="up">
          <div className="rounded-brand border border-line bg-white p-6 md:p-9">
            <ReviewsBlock product={product} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
