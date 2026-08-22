"use client";

import { createContext, useContext, useMemo } from "react";
import type { Product } from "@/types";
import { products as fallbackProducts } from "@/data/products";

/**
 * The live catalogue, made available to client components.
 * ---------------------------------------------------------------------------
 * lib/catalog.ts reads the panel database, so it can only run on the server.
 * But several client components need to look a product up by id — the wishlist
 * page, Recently viewed, the wishlist heart's sync call — and they used to do
 * it by importing the STATIC `data/products.ts`, which is compiled into the
 * bundle and therefore froze at build time.
 *
 * The root layout (a server component) reads the catalogue once per request,
 * already cached, and hands it down here. One fetch, no client-side round trip,
 * and every client lookup now sees the same prices the server charges.
 *
 * `fallbackProducts` is the default so a component rendered outside the
 * provider still works rather than throwing — it degrades to the built-in
 * catalogue exactly as before.
 */
const CatalogContext = createContext<Product[]>(fallbackProducts);

export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  // Products arrive as a fresh array on every server render; memoising on the
  // length + first/last id keeps consumers from re-rendering when nothing
  // meaningful changed.
  const key = `${products.length}:${products[0]?.id ?? ""}:${products[products.length - 1]?.id ?? ""}`;
  const value = useMemo(() => products, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

/** Every sellable product, as the server currently sees it. */
export function useCatalog(): Product[] {
  return useContext(CatalogContext);
}

/** One product by id — the client-side twin of lib/catalog.getProductById. */
export function useProductById(id: string | null | undefined): Product | undefined {
  const products = useCatalog();
  if (!id) return undefined;
  return products.find((p) => String(p.id) === String(id));
}
