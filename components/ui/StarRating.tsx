import { cn } from "@/utils/cn";

/** Renders ★ rating using full/half/empty glyphs. */
export function StarRating({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = { sm: "text-[13px]", md: "text-base", lg: "text-xl" }[size];
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "★";
    if (i === full && half) return "⯨";
    return "☆";
  });
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className={cn("stars", sizeClass)} aria-label={`${rating} out of 5 stars`}>
        {stars.join("")}
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-muted">({count.toLocaleString("en-IN")})</span>
      )}
    </span>
  );
}
