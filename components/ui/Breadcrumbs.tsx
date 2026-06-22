import Link from "next/link";
import { cn } from "@/utils/cn";

export interface Crumb {
  label: string;
  href?: string;
}

/** Simple breadcrumb trail. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-brand transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(last && "text-ink font-medium")}>{item.label}</span>
              )}
              {!last && <span className="text-line">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
