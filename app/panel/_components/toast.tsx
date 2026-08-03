"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Icon } from "./Icon";

type ToastKind = "success" | "error" | "info";
interface ToastMsg {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastCtx = createContext<{
  push: (kind: ToastKind, text: string) => void;
} | null>(null);

let counter = 0;

/** Errors stay until dismissed; the reader may need to act on them. */
const AUTO_DISMISS_MS: Record<ToastKind, number> = {
  success: 3800,
  info: 4200,
  error: 0,
};

const STYLE: Record<ToastKind, { cls: string; icon: string; label: string }> = {
  success: { cls: "bg-brand text-white", icon: "check", label: "Success" },
  error: { cls: "bg-red-600 text-white", icon: "alert", label: "Error" },
  info: { cls: "bg-ink text-white", icon: "eye", label: "Note" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = ++counter;
      setToasts((t) => [...t, { id, kind, text }]);
      const ms = AUTO_DISMISS_MS[kind];
      if (ms > 0) setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {/* Announced to screen readers: errors interrupt, the rest wait politely. */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex w-[min(92vw,26rem)] flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const s = STYLE[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              aria-live={t.kind === "error" ? "assertive" : "polite"}
              className={`animate-slideUp flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-brand-lg ${s.cls}`}
            >
              <Icon name={s.icon} size={16} className="mt-0.5 flex-none" />
              <span className="sr-only">{s.label}: </span>
              <span className="flex-1">{t.text}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-my-1 -mr-1.5 flex-none rounded-xl p-1.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  return (
    ctx ?? {
      push: (_k: ToastKind, _t: string) => {
        /* no-op outside provider */
      },
    }
  );
}
