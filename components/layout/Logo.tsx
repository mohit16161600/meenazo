import Link from "next/link";
import { siteConfig } from "@/data/site";
import { IconLeaf } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

/** Brand logo (template `.logo` with a leaf mark). */
export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={cn("font-extrabold text-[22px] tracking-tight inline-flex items-center gap-2", dark && "text-white", className)}>
      <span className="w-8 h-8 rounded-full bg-brand text-white inline-flex items-center justify-center">
        <IconLeaf size={18} strokeWidth={2} />
      </span>
      {siteConfig.name}
    </Link>
  );
}
