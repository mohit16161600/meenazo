"use client";

import { useEffect, type ReactNode } from "react";
import { IconClose } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

/** Centered modal with backdrop. Used for Quick View. */
export function Modal({
  open,
  onClose,
  children,
  className,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizeClass = { md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[size];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full bg-white rounded-brand shadow-brand-lg max-h-[90vh] overflow-auto animate-slideUp",
          sizeClass,
          className
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-soft hover:bg-mint flex items-center justify-center text-ink"
        >
          <IconClose size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
