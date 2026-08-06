import Image from "next/image";
import { cn } from "@/utils/cn";

/**
 * Renders a real image when `src` is provided (optimized via next/image),
 * otherwise falls back to a gradient + emoji placeholder. Used for products,
 * categories, blog, before/after, etc. so the same call site works whether or
 * not a real image exists yet.
 *
 * `fit` picks how the box is sized:
 * - `cover` / `contain` — the call site fixes the box (an aspect or a height)
 *   and the image is fitted into it, so a mismatched image gets cropped or
 *   letterboxed. Right for grids that must stay aligned (products, thumbs).
 * - `natural` — the *image* sets the height, at whatever ratio the file
 *   actually has. Nothing is ever cropped. Don't pass an aspect/height class
 *   alongside it. The `width`/`height` below are only a pre-load hint to
 *   reserve space; `h-auto` lets the browser re-lay it out at the real ratio
 *   once the file is decoded.
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
  fit?: "contain" | "cover" | "natural";
  sizes?: string;
}) {
  const bg = gradient ? `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})` : undefined;
  const natural = fit === "natural";

  return (
    <div
      className={cn(
        "art-ph relative overflow-hidden select-none",
        // No image to measure, so the emoji fallback still needs a box.
        natural && !src && "aspect-[16/9]",
        className
      )}
      style={bg ? { background: bg } : undefined}
    >
      {src ? (
        natural ? (
          <Image src={src} alt={alt} width={1600} height={900} sizes={sizes} className="h-auto w-full" />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={cn(fit === "cover" ? "object-cover" : "object-contain p-2")}
          />
        )
      ) : (
        <span aria-hidden style={{ fontSize }}>
          {emoji}
        </span>
      )}
    </div>
  );
}
