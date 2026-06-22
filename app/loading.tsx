import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";

/**
 * Global route-loading fallback shown during navigation/data fetches.
 * Mirrors the typical page rhythm: a hero band followed by a product grid.
 */
export default function Loading() {
  return (
    <section className="section-y" aria-busy="true" aria-label="Loading content">
      <Container>
        {/* Hero band */}
        <div className="card-surface p-8 md:p-12 mb-10">
          <div className="max-w-xl space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-3 pt-3">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
        </div>

        {/* Section heading */}
        <div className="space-y-3 mb-8 max-w-md">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Product grid */}
        <ProductGridSkeleton count={6} />
      </Container>
    </section>
  );
}
