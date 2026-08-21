import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { blogPosts } from "@/data/blog";
import { imgSrc } from "@/utils/image";

/**
 * XML sitemap: every public route, built from the same data layer the pages
 * themselves render from, so it can never list a page that doesn't exist or
 * miss one that does.
 *
 * ABOUT `lastModified`
 * Every entry used to carry `new Date()`, which told Google that all 23 pages
 * changed at the moment of every deploy. That is not true — the return policy
 * does not change because a blog post did — and a feed that cries wolf on every
 * build is one a crawler learns to discount. Each entry now carries the newest
 * date it can actually justify, and pages with no content date of their own
 * carry a fixed one that only moves when their content really does.
 *
 * This file is the sitemap ITSELF; submitting it is a separate, manual step in
 * Search Console (Sitemaps → enter `sitemap.xml` → Submit). A sitemap that is
 * served but never submitted is still discovered via robots.txt, just slower.
 */

/**
 * Stand-in "last changed" for pages whose content lives in the code rather than
 * in the data layer (policies, about, contact). Bump this by hand when one of
 * them is genuinely rewritten — that is the whole point of it being a constant
 * instead of `new Date()`.
 */
const STATIC_CONTENT_DATE = new Date("2026-08-20T00:00:00.000Z");

/** The newest date on any post — what /blog itself was last meaningfully updated. */
function newestPostDate(): Date {
  const times = blogPosts
    .map((p) => (p.date ? new Date(p.date).getTime() : NaN))
    .filter((t) => Number.isFinite(t));
  return times.length ? new Date(Math.max(...times)) : STATIC_CONTENT_DATE;
}

/**
 * When a catalogue entry last changed. The published snapshot carries the
 * panel's own `updatedAt`; the hardcoded fallback catalogue has no timestamps,
 * so those fall back to the static date rather than inventing "now".
 */
function entryDate(entry: { updatedAt?: string | null; createdAt?: string | null }): Date {
  const raw = entry.updatedAt ?? entry.createdAt;
  if (!raw) return STATIC_CONTENT_DATE;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? STATIC_CONTENT_DATE : d;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const catalogueDate = products.length
    ? new Date(Math.max(...products.map((p) => entryDate(p).getTime())))
    : STATIC_CONTENT_DATE;

  const staticRoutes: MetadataRoute.Sitemap = [
    // The shop's two front doors move whenever the catalogue does.
    { path: "/", priority: 1, changeFrequency: "daily", lastModified: catalogueDate },
    { path: "/shop", priority: 0.9, changeFrequency: "daily", lastModified: catalogueDate },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly", lastModified: newestPostDate() },
    { path: "/about", priority: 0.6, changeFrequency: "monthly", lastModified: STATIC_CONTENT_DATE },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly", lastModified: STATIC_CONTENT_DATE },
    { path: "/faq", priority: 0.5, changeFrequency: "monthly", lastModified: STATIC_CONTENT_DATE },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly", lastModified: STATIC_CONTENT_DATE },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly", lastModified: STATIC_CONTENT_DATE },
    { path: "/shipping-policy", priority: 0.3, changeFrequency: "yearly", lastModified: STATIC_CONTENT_DATE },
    { path: "/return-policy", priority: 0.3, changeFrequency: "yearly", lastModified: STATIC_CONTENT_DATE },
    { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly", lastModified: STATIC_CONTENT_DATE },
  ].map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    lastModified: entryDate(category as { updatedAt?: string | null; createdAt?: string | null }),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    // Absolute image URLs let Google Images index the product shots — the
    // pictures are most of what a supplement listing is judged on, and a
    // relative path in a sitemap is simply ignored.
    const images = (product.images ?? [])
      .map((ref) => imgSrc(ref))
      .filter((src): src is string => Boolean(src))
      .map((src) => (src.startsWith("http") ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`));

    return {
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: entryDate(product as { updatedAt?: string | null; createdAt?: string | null }),
      changeFrequency: "weekly",
      priority: 0.9, // a shop's money pages outrank its category listings
      ...(images.length ? { images } : {}),
    };
  });

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : STATIC_CONTENT_DATE,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
