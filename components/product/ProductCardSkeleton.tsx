import { Skeleton } from "@/components/ui/Skeleton";

/** Loading placeholder mirroring ProductCard. */
export function ProductCardSkeleton() {
  return (
    <div className="card-surface">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
