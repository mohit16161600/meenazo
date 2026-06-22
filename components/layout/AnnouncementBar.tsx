"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";

/** Rotating announcement topbar (template `.topbar`). */
export function AnnouncementBar() {
  const messages = siteConfig.announcements;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className="bg-brand-dark text-white text-center text-[13px] py-2.5 px-4">
      <span key={i} className="inline-block animate-fadeIn">
        {messages[i]}
      </span>
    </div>
  );
}
