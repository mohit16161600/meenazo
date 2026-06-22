import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton shown while the product detail page loads. */
export default function Loading() {
  return (
    <Container className="py-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-72 mb-8" />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <div className="flex sm:flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="flex-1 aspect-square rounded-brand" />
        </div>

        {/* BuyBox */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>
          <Skeleton className="h-20 w-full rounded-brand" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-brand" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
