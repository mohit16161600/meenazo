"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";

/**
 * Records the current product into the recently-viewed store on mount.
 * Renders nothing — purely a side-effect component.
 */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    useRecentlyViewedStore.getState().add(productId);
  }, [productId]);

  return null;
}
