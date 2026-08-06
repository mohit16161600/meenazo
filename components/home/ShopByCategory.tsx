import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { categories } from "@/data/categories";

/**
 * Shop-by-category strip — image tiles with the label sitting on the art,
 * mirroring the hero's editorial feel. Scrolls horizontally on phones so a
 * long category list never squeezes into unreadable columns.
 */
export function ShopByCategory() {
  return (
    <section className="section-y">
      <Container>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-rule">Browse</span>
            <h2 className="mt-2">
              Shop by <span className="script">category</span>
            </h2>
            <p className="mt-2 max-w-lg text-muted">
              Find the right Ayurvedic formulation for your wellness goal, backed by time-honoured herbs.
            </p>
          </div>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand transition-colors hover:text-brand-dark"
          >
            View all products
            <Icon
              name="arrow-right"
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:gap-5">
          {categories.map((category) => (
            <li key={category.id} className="w-[62%] flex-none snap-start sm:w-auto">
              <Link
                href={`/category/${category.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-brand shadow-brand ring-1 ring-line transition-all hover:shadow-brand-lg"
                aria-label={`${category.name} — ${category.description}`}
              >
                {/* Art */}
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${category.gradient[0]}, ${category.gradient[1]})`,
                  }}
                />
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 62vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                ) : (
                  <span
                    className="absolute inset-0 grid place-items-center text-[72px] leading-none"
                    aria-hidden
                  >
                    {category.emoji}
                  </span>
                )}

                {/* Readability scrim — the label sits on the art like the reference */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent"
                />

                <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <span className="block text-base font-extrabold leading-tight text-white sm:text-lg">
                    {category.name}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-white/85">
                    Shop now
                    <Icon
                      name="arrow-right"
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>

                {category.productCount > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur">
                    {category.productCount} products
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
