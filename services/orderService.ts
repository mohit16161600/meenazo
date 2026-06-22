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
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VP${new Date().getFullYear()}${rand}`;
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

  async list(userId?: string): Promise<Order[]> {
    const orders = readOrders().filter((o) => (userId ? o.userId === userId : true));
    return new Promise((r) => setTimeout(() => r(orders), 300));
  },

  async get(id: string): Promise<Order | null> {
    const order = readOrders().find((o) => o.id === id || o.orderNumber === id) ?? null;
    return new Promise((r) => setTimeout(() => r(order), 300));
  },
};
