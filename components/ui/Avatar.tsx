import Image from "next/image";
import type { ImageRef } from "@/types";
import { imgAlt, imgSrc } from "@/utils/image";
import { cn } from "@/utils/cn";

/**
 * A profile value is a picture when it points at a file — a public path
 * (`/images/reviews/pooja.webp`), a remote URL, or an inline data URI.
 * Anything else is treated as an emoji, so the two can share one field and
 * old emoji rows keep working while real photos are added one by one.
 */
export function isImageSrc(value?: ImageRef | null): boolean {
  const v = imgSrc(value);
  if (!v) return false;
  return v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:");
}

/** Initial used when there is neither a photo nor an emoji to show. */
function initial(name?: string): string {
  const ch = name?.trim()?.charAt(0);
  return ch ? ch.toUpperCase() : "🙂";
}

/**
 * Round profile picture for reviews and testimonials. Renders the real photo
 * when `src` is an image, otherwise falls back to the emoji (or the name's
 * initial), so a review without a picture still looks deliberate.
 *
 * Size comes from `className` (e.g. `h-10 w-10`) because the surrounding
 * layouts already size it; `emojiSize` only scales the fallback glyph.
 */
export function Avatar({
  src,
  name,
  className,
  emojiSize = 18,
}: {
  src?: ImageRef | null;
  name?: string;
  className?: string;
  emojiSize?: number;
}) {
  const photo = isImageSrc(src);

  return (
    <span
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mint",
        className
      )}
    >
      {photo ? (
        <Image
          src={imgSrc(src)!}
          alt={imgAlt(src, name ? `${name} profile photo` : "")}
          fill
          sizes="96px"
          className="object-cover"
        />
      ) : (
        <span aria-hidden style={{ fontSize: emojiSize }}>
          {(typeof src === "string" ? src.trim() : "") || initial(name)}
        </span>
      )}
    </span>
  );
}
