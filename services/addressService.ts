"use client";

import type { Address } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";

/** Dummy saved-address book in localStorage. */
function read(): Address[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.addresses) ?? "[]");
  } catch {
    return [];
  }
}
function write(list: Address[]) {
  localStorage.setItem(STORAGE_KEYS.addresses, JSON.stringify(list));
}

export const addressService = {
  list: (): Address[] => read(),
  save(address: Omit<Address, "id"> & { id?: string }): Address[] {
    const list = read();
    if (address.isDefault) list.forEach((a) => (a.isDefault = false));
    if (address.id) {
      const idx = list.findIndex((a) => a.id === address.id);
      if (idx >= 0) list[idx] = address as Address;
    } else {
      list.push({ ...address, id: "addr-" + Math.random().toString(36).slice(2, 9) });
    }
    write(list);
    return list;
  },
  remove(id: string): Address[] {
    const list = read().filter((a) => a.id !== id);
    write(list);
    return list;
  },
  setDefault(id: string): Address[] {
    const list = read().map((a) => ({ ...a, isDefault: a.id === id }));
    write(list);
    return list;
  },
};
