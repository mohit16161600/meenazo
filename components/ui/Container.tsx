import { cn } from "@/utils/cn";
import type { ElementType, ReactNode } from "react";

/** Centered max-width wrapper (matches template `.wrap`). */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={cn("wrap", className)}>{children}</Tag>;
}
