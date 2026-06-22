import type { ReactNode } from "react";
import { Button } from "./Button";

/** Friendly empty state for cart, wishlist, search, orders, etc. */
export function EmptyState({
  emoji = "🌿",
  title,
  message,
  actionLabel,
  actionHref,
  children,
}: {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="text-6xl mb-5">{emoji}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {message && <p className="text-muted max-w-md mb-6">{message}</p>}
      {actionLabel && actionHref && (
        <Button href={actionHref}>{actionLabel}</Button>
      )}
      {children}
    </div>
  );
}
