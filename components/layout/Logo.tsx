import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { IconLeaf } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

/**
 * Brand logo. Renders the real artwork when `siteConfig.logoImage` is set and
 * falls back to the leaf mark + wordmark when it isn't, so clearing the field
 * in the panel degrades instead of leaving an empty header.
 *
 * Height is fixed and the width follows the file's own ratio — swap in a
 * differently proportioned logo and it still sits correctly in the 74px bar.
 * The artwork has no transparency, so on dark surfaces (`dark`) it goes on a
 * white chip rather than straight onto the dark panel.
 */
export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  const src = siteConfig.logoImage?.trim();

  return (
    <Link
      href="/"
      aria-label={siteConfig.name}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {src ? (
        <Image
          src={src}
          alt={siteConfig.name}
          width={1774}
          height={887}
          priority
          className={cn("h-12 w-auto md:h-14", dark && "rounded-xl bg-white p-1.5")}
        />
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-2 text-[22px] font-extrabold tracking-tight",
            dark && "text-white"
          )}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
            <IconLeaf size={18} strokeWidth={2} />
          </span>
          {siteConfig.name}
        </span>
      )}
    </Link>
  );
}
