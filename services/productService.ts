import type { Product, ProductFilters, PaginatedResult, SortOption } from "@/types";
import { products } from "@/data/products";
import { PRODUCTS_PER_PAGE } from "@/utils/constants";
import { effectivePrice } from "@/utils/format";
import { delay } from "./api";

function sortProducts(list: Product[], sort: SortOption = "featured"): Product[] {
  const arr = [...list];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => effectivePrice(a.price, a.salePrice) - effectivePrice(b.price, b.salePrice));
    case "price-desc":
      return arr.sort((a, b) => effectivePrice(b.price, b.salePrice) - effectivePrice(a.price, a.salePrice));
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    case "newest":
      return arr.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    case "name-asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return arr.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating);
  }
}

/** Synchronous filter used by client components for instant UX. */
export function filterProducts(filters: ProductFilters): PaginatedResult<Product> {
  let list = [...products];
  const { query, categories, minPrice, maxPrice, minRating, inStock, tags, sort, page = 1 } = filters;
  const perPage = filters.perPage ?? PRODUCTS_PER_PAGE;

  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }
  if (categories?.length) list = list.filter((p) => categories.includes(p.category));
  if (typeof minPrice === "number") list = list.filter((p) => effectivePrice(p.price, p.salePrice) >= minPrice);
  if (typeof maxPrice === "number") list = list.filter((p) => effectivePrice(p.price, p.salePrice) <= maxPrice);
  if (typeof minRating === "number") list = list.filter((p) => p.rating >= minRating);
  if (inStock) list = list.filter((p) => p.stock > 0);
  if (tags?.length) {
    if (tags.includes("sale")) list = list.filter((p) => p.salePrice != null);
  }

  list = sortProducts(list, sort);

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const items = list.slice(start, start + perPage);

  return { items, total, page: safePage, perPage, totalPages };
}

/* ---- Async API-shaped wrappers (use in server components / future API) ---- */
export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResult<Product>> {
  return delay(filterProducts(filters));
}
export async function getProduct(slug: string): Promise<Product | null> {
  return delay(products.find((p) => p.slug === slug) ?? null);
}
export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const current = products.find((p) => p.slug === slug);
  if (!current) return delay([]);
  const related = products
    .filter((p) => p.slug !== slug && p.category === current.category)
    .slice(0, limit);
  const fill = products.filter((p) => p.slug !== slug && !related.includes(p)).slice(0, limit - related.length);
  return delay([...related, ...fill].slice(0, limit));
}
export async function searchProducts(query: string, limit = 6): Promise<Product[]> {
  return delay(filterProducts({ query, perPage: limit }).items);
}

/** Min/max price across the catalog — used to bound the price filter. */
export function getPriceRange(): { min: number; max: number } {
  const prices = products.map((p) => effectivePrice(p.price, p.salePrice));
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}
