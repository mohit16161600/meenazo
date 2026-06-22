import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

type Tone = "brand" | "soft" | "gold" | "red";
const tone: Record<Tone, string> = {
  brand: "chip",
  soft: "chip chip-soft",
  gold: "chip chip-gold",
  red: "chip chip-red",
};

/** Small pill label. Auto-tones sale/new/bestseller badges. */
export function Badge({
  children,
  variant = "brand",
  className,
}: {
  children: ReactNode;
  variant?: Tone;
  className?: string;
}) {
  return <span className={cn(tone[variant], className)}>{children}</span>;
}

/** Pick a sensible tone for a product badge label. */
export function toneForBadge(label: string): Tone {
  const l = label.toLowerCase();
  if (l.includes("%") || l.includes("off") || l.includes("sale")) return "red";
  if (l.includes("new")) return "gold";
  if (l.includes("best")) return "brand";
  return "soft";
}
