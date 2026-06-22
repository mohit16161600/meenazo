"use client";

import { useToast } from "@/context/ToastContext";
import type { ToastType } from "@/types";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/ui/Icon";

const icon: Record<ToastType, string> = {
  success: "check-circle",
  error: "alert",
  info: "info",
  warning: "bell",
};
const iconColor: Record<ToastType, string> = {
  success: "text-brand",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-gold",
};
const accent: Record<ToastType, string> = {
  success: "border-l-brand",
  error: "border-l-red-400",
  info: "border-l-blue-400",
  warning: "border-l-gold",
};

/** Fixed toast stack. Renders from ToastContext (must be inside ToastProvider). */
export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 w-[330px] max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto bg-white rounded-xl shadow-brand-lg border border-line border-l-4 p-3.5 flex gap-3 animate-slideUp",
            accent[t.type]
          )}
          role="status"
        >
          <Icon name={icon[t.type]} size={20} className={cn("shrink-0", iconColor[t.type])} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-ink">{t.title}</p>
            {t.message && <p className="text-xs text-muted mt-0.5 truncate">{t.message}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink text-sm shrink-0" aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
