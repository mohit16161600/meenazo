"use client";

import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Toaster } from "@/components/ui/Toaster";
import { FloatingButtons } from "@/components/ui/FloatingButtons";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";

/**
 * Global client providers. Also rehydrates the persisted Zustand stores after
 * mount (stores use skipHydration so SSR markup matches first client render).
 */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
    useRecentlyViewedStore.persist.rehydrate();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        {children}
        <Toaster />
        <FloatingButtons />
      </ToastProvider>
    </AuthProvider>
  );
}
