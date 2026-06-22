"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";
import { IconArrowUp, IconWhatsApp } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

/** WhatsApp chat button + Back-to-top, fixed bottom-right. */
export function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-center gap-3">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={cn(
          "w-11 h-11 rounded-full bg-white border border-line shadow-brand flex items-center justify-center text-lg transition-all hover:bg-mint",
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        )}
      >
        <IconArrowUp size={20} />
      </button>
      <a
        href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
          "Hi Meenazo! I'd like some Ayurvedic guidance."
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-brand-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <IconWhatsApp size={30} />
      </a>
    </div>
  );
}
