import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

/**
 * Robots policy: index everything public, keep private and
 * transactional flows (account, checkout, cart) out of search.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/checkout", "/cart"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
