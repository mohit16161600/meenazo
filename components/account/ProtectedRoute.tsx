"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/ui/Icon";

/**
 * Guards a subtree behind authentication.
 * - While the auth session is resolving -> a calm centered loader.
 * - When unauthenticated -> redirects to /login carrying the current path,
 *   so the user lands back here after signing in.
 * - When authenticated -> renders the protected children.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const target = pathname || "/account";
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-32 text-center"
        role="status"
        aria-live="polite"
      >
        <span
          className="inline-block w-10 h-10 rounded-full border-[3px] border-line border-t-brand animate-spin"
          aria-hidden
        />
        <p className="text-sm text-muted">Loading your account…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
        <Icon name="lock" size={36} className="text-muted" />
        <p className="text-sm text-muted">Redirecting you to sign in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
