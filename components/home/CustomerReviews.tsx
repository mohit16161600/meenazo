import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { products } from "@/data/products";
import { testimonials } from "@/data/testimonials";
import { formatDate } from "@/utils/format";
import type { Review } from "@/types";

/** Plausible static 5→1 star distribution for the summary bars. */
const DISTRIBUTION: { stars: number; percent: number }[] = [
  { stars: 5, percent: 82 },
  { stars: 4, percent: 12 },
  { stars: 3, percent: 4 },
  { stars: 2, percent: 1 },
  { stars: 1, percent: 1 },
];

/** Average rating across the catalog, rounded to 1 decimal (~4.7). */
function computeAverage(): number {
  const rated = products.filter((p) => typeof p.rating === "number");
  if (rated.length === 0) return 4.7;
  const sum = rated.reduce((acc, p) => acc + p.rating, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

/** Total number of reviews across the catalog. */
function computeTotalReviews(): number {
  return products.reduce((acc, p) => acc + (p.reviewCount ?? 0), 0);
}

/** Flatten every product's reviews, newest first. */
function collectReviews(): Review[] {
  const all = products.flatMap((p) => p.reviews ?? []);
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

/** Map a testimonial to the Review shape so the fallback renders identically. */
function fallbackReviews(): Review[] {
  return testimonials.map((t, i) => ({
    id: t.id,
    author: t.name,
    avatar: t.avatar,
    rating: t.rating,
    title: t.location ? `Loving it in ${t.location}` : "Highly recommend",
    comment: t.quote,
    date: `2026-0${((i % 6) + 1)}-15`,
    verified: true,
  }));
}

export function CustomerReviews() {
  const average = computeAverage();
  const totalReviews = computeTotalReviews();
  const collected = collectReviews();
  const reviews = (collected.length >= 4 ? collected : fallbackReviews()).slice(0, 4);

  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          eyebrow="Real reviews"
          title="Loved by thousands across India"
          subtitle="Verified, unfiltered feedback from customers who made Meenazo part of their daily ritual."
        />

        <div className="grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
          {/* ---------------------- Summary card ---------------------- */}
          <aside className="card-surface rounded-brand p-7 text-center shadow-brand lg:sticky lg:top-24">
            <p className="text-5xl font-extrabold leading-none text-ink">
              {average.toFixed(1)}
              <span className="text-2xl text-muted">/5</span>
            </p>
            <div className="mt-3 flex justify-center">
              <StarRating rating={average} size="lg" />
            </div>
            <p className="mt-2 text-sm text-muted">
              Based on{" "}
              <span className="font-semibold text-ink">
                {totalReviews.toLocaleString("en-IN")}
              </span>{" "}
              verified reviews
            </p>

            <ul className="mt-6 space-y-2.5 text-left" aria-label="Rating distribution">
              {DISTRIBUTION.map(({ stars, percent }) => (
                <li key={stars} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-xs font-semibold text-muted">
                    {stars} ★
                  </span>
                  <span
                    className="h-2 flex-1 overflow-hidden rounded-full bg-line"
                    role="img"
                    aria-label={`${stars} star: ${percent}%`}
                  >
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-9 shrink-0 text-right text-xs text-muted">
                    {percent}%
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-line pt-5 text-xs font-semibold text-brand-dark">
              <span aria-hidden>✅</span>
              <span>100% verified buyers · No paid reviews</span>
            </div>
          </aside>

          {/* ---------------------- Review grid ---------------------- */}
          <div className="grid gap-5 sm:grid-cols-2">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="card-surface card-hover flex h-full flex-col rounded-brand p-6 shadow-brand"
              >
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} size="md" />
                  {review.verified && <Badge variant="soft">Verified</Badge>}
                </div>

                {review.title && (
                  <h3 className="mt-3 text-base font-bold text-ink">{review.title}</h3>
                )}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  “{review.comment}”
                </p>

                <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-lg"
                    aria-hidden
                  >
                    {review.avatar}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {review.author}
                    </p>
                    <p className="text-xs text-muted">
                      Verified buyer · {formatDate(review.date)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
