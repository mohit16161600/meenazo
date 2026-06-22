import Image from "next/image";
import { cn } from "@/utils/cn";

/**
 * Renders a real image when `src` is provided (optimized via next/image),
 * otherwise falls back to a gradient + emoji placeholder. Used for products,
 * categories, blog, before/after, etc. so the same call site works whether or
 * not a real image exists yet.
 */
export function ArtPlaceholder({
  emoji,
  gradient,
  className,
  fontSize = 86,
  src,
  alt = "",
  fit = "contain",
  sizes = "(max-width: 768px) 100vw, 450px",
}: {
  emoji?: string;
  gradient?: [string, string];
  className?: string;
  fontSize?: number;
  src?: string | null;
  alt?: string;
  fit?: "contain" | "cover";
  sizes?: string;
}) {
  const bg = gradient ? `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})` : undefined;

  return (
    <div
      className={cn("art-ph relative overflow-hidden select-none", className)}
      style={bg ? { background: bg } : undefined}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(fit === "cover" ? "object-cover" : "object-contain p-2")}
        />
      ) : (
        <span aria-hidden style={{ fontSize }}>
          {emoji}
        </span>
      )}
    </div>
  );
}
