import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Eyebrow + heading + optional subtitle and right-aligned action (template `.sec-head`). */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  center,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("sec-head", center && "flex-col items-center text-center", className)}>
      <div className={cn(center && "max-w-2xl")}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="mt-1.5">{title}</h2>
        {subtitle && <p className={cn(center && "mx-auto")}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
