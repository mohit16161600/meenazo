"use client";

import { createContext, useCallback, useContext, useState } from "react";

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = ++counter;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slideUp rounded-xl px-4 py-3 text-sm font-medium shadow-brand-lg ${
              t.kind === "success"
                ? "bg-brand text-white"
                : t.kind === "error"
                ? "bg-red-600 text-white"
                : "bg-ink text-white"
            }`}
          >
            {t.text}
          </div>
        ))}
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
