"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import type { FAQItem } from "@/types";

/** Accessible accordion used for FAQs and product info. */
export function Accordion({ items, className }: { items: FAQItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={cn("divide-y divide-line border border-line rounded-brand overflow-hidden bg-white", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold hover:bg-soft transition-colors"
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <span className={cn("text-brand text-xl transition-transform shrink-0", isOpen && "rotate-45")}>
                +
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-muted text-sm leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
