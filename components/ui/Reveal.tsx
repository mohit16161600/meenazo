"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger this item's entrance (ms). Use small steps (60–120) within a group. */
  delay?: number;
  /** Entrance direction. Default "up". */
  from?: "up" | "left" | "right" | "zoom";
};

/**
 * Reveal-on-scroll wrapper. Uses a native IntersectionObserver (zero extra JS
 * deps) to add an "in" class the first time the element scrolls into view; the
 * actual motion is GPU-accelerated CSS (see globals.css). Honours
 * `prefers-reduced-motion`. Wrap below-the-fold blocks only — above-the-fold
 * content should render instantly without a reveal.
 */
export function Reveal({ children, className, delay = 0, from = "up" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion users (or no IO support) get the content immediately.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={from}
      className={cn("reveal", shown && "reveal-in", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
