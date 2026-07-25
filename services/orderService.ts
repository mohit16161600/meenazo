"use client";

import type { Order } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";

/** Dummy order persistence in localStorage, API-shaped for future Laravel swap. */

function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) ?? "[]");
  } catch {
    return [];
  }
}
function writeOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  } catch {
    // Storage full / Safari private mode: the order is already recorded &
    // charged server-side, so a failed local copy must never bubble up as a
    // "payment failed" error. Swallow it — the customer's order still stands.
  }
}

export function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MZ${new Date().getFullYear()}${rand}`;
}

export const orderService = {
  async create(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
    const full: Order = {
      ...order,
      id: "o-" + Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
    };
    const orders = readOrders();
    orders.unshift(full);
    writeOrders(orders);
    return new Promise((r) => setTimeout(() => r(full), 600));
  },

  // Reads come from the REAL server (panel DB, scoped to the signed-in customer
  // by session cookie). `userId` is ignored — the session identifies the user.
  async list(_userId?: string): Promise<Order[]> {
    try {
      const res = await fetch("/api/customer/orders", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) return [];
      const data = (await res.json()) as { success?: boolean; orders?: Order[] };
      return data.success && Array.isArray(data.orders) ? data.orders : [];
    } catch {
      return [];
    }
  },

  async get(id: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/customer/orders/${encodeURIComponent(id)}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { success?: boolean; order?: Order };
      return data.success && data.order ? data.order : null;
    } catch {
      return null;
    }
  },
};
