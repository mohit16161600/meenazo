import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";

export default function ShopLoading() {
  return (
    <>
      <section className="bg-mint">
        <Container className="py-10 md:py-14">
          <Skeleton className="h-3 w-40 mb-4" />
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </Container>
      </section>

      <section className="section-y">
        <Container>
          <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block card-surface p-5 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>

            {/* Results skeleton */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-40 rounded-full" />
              </div>
              <ProductGridSkeleton count={9} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
