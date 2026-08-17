import Image from "next/image";
import type { ImageRef } from "@/types";
import { imgAlt, imgSrc, imgTitle } from "@/utils/image";
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
  imgClassName,
  fontSize = 86,
  src,
  alt = "",
  fit = "contain",
  sizes = "(max-width: 768px) 100vw, 450px",
}: {
  emoji?: string;
  gradient?: [string, string];
  className?: string;
  /**
   * Extra classes for the <Image> itself (contain/cover modes) — inset padding
   * and hover transforms belong here, not on the box: `fill` positions against
   * the padding box, so padding on the wrapper would not inset the image.
   */
  imgClassName?: string;
  fontSize?: number;
  /** Path, or an asset object carrying its own alt text. */
  src?: ImageRef | null;
  /** What the image means here — used when the asset has no alt of its own. */
  alt?: string;
  fit?: "contain" | "cover" | "natural";
  sizes?: string;
}) {
  const bg = gradient ? `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})` : undefined;
  const natural = fit === "natural";
  // The asset's own alt wins; `alt` is the contextual fallback so an image is
  // never rendered with nothing to announce.
  const url = imgSrc(src);
  const altText = imgAlt(src, alt);
  const title = imgTitle(src);

  return (
    <div
      className={cn(
        "art-ph relative overflow-hidden select-none",
        // No image to measure, so the emoji fallback still needs a box.
        natural && !url && "aspect-[16/9]",
        className
      )}
      style={bg ? { background: bg } : undefined}
    >
      {url ? (
        natural ? (
          <Image
            src={url}
            alt={altText}
            title={title}
            width={1600}
            height={900}
            sizes={sizes}
            className="h-auto w-full"
          />
        ) : (
          <Image
            src={url}
            alt={altText}
            title={title}
            fill
            sizes={sizes}
            className={cn(
              fit === "cover" ? "object-cover" : "object-contain p-2",
              imgClassName
            )}
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
