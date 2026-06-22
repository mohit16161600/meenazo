"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS, RECENTLY_VIEWED_LIMIT } from "@/utils/constants";

interface RecentlyViewedState {
  ids: string[];
  add: (productId: string) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      ids: [],
      add: (productId) =>
        set((state) => ({
          ids: [productId, ...state.ids.filter((id) => id !== productId)].slice(0, RECENTLY_VIEWED_LIMIT),
        })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: STORAGE_KEYS.recentlyViewed,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
