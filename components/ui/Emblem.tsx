import Image from "next/image";
import type { ImageRef } from "@/types";
import { imgAlt, imgSrc } from "@/utils/image";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

/**
 * A fixed-size art slot for the small marks that sit above a title — feature
 * bars, "why choose us" cards, certifications, trust badges.
 *
 * The point is that the BOX never changes size. Whether a slot currently holds
 * an uploaded picture, a semantic SVG icon key (`leaf`, `truck`, …) or a raw
 * emoji, it occupies exactly the same space, so swapping an icon for a real
 * image later never reflows the layout around it.
 *
 * Precedence: `image` → `icon` (SVG key) → the icon string rendered as text
 * (which is how a raw emoji still works).
 */
export function Emblem({
  image,
  icon,
  alt = "",
  className,
  iconSize = 24,
  rounded = "rounded-2xl",
}: {
  /** Uploaded artwork. Any path under public/. Wins over `icon`. */
  image?: ImageRef | null;
  /** Semantic icon key, or a raw emoji as a last resort. */
  icon?: string;
  alt?: string;
  /** Sizing + colours for the box, e.g. "h-14 w-14 bg-mint text-brand". */
  className?: string;
  iconSize?: number;
  rounded?: string;
}) {
  const src = imgSrc(image);
  // Icon keys are lowercase ascii; anything else (an emoji) renders as text.
  const isIconKey = !!icon && /^[a-z][a-z0-9-]*$/.test(icon);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        rounded,
        "h-14 w-14 bg-mint text-brand",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={imgAlt(image, alt)}
          width={160}
          height={160}
          className="h-full w-full object-contain p-1.5"
        />
      ) : isIconKey ? (
        <Icon name={icon!} size={iconSize} />
      ) : (
        <span aria-hidden style={{ fontSize: iconSize + 4 }}>
          {icon}
        </span>
      )}
    </span>
  );
}
