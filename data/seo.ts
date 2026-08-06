import type { GlobalSeo } from "@/types";
import { siteConfig, SITE_URL } from "./site";
import genSite from "./generated/site.json";

/**
 * Site-wide SEO defaults.
 *
 * Every page inherits from here, so this is the one place that decides what an
 * un-edited page looks like in search results and on social. The panel's Global
 * SEO screen writes into the same shape, and the published snapshot
 * (data/generated/site.json) is merged on top — exactly like siteConfig.
 */
const fallbackGlobalSeo: GlobalSeo = {
  titleSuffix: siteConfig.name,
  seoTitle: `${siteConfig.name} — ${siteConfig.tagline}`,
  seoDescription: siteConfig.description,
  seoKeywords: [
    "ayurvedic medicine",
    "ayurvedic supplements",
    "herbal supplements india",
    "meenazo",
  ],
  robots: "index, follow",
  defaultOgImage: "/images/meenazo-logo.webp",
  twitterSite: null,
  googleSiteVerification: null,
  bingSiteVerification: null,
  facebookDomainVerification: null,
  pinterestVerification: null,
  googleAnalyticsId: null,
  googleTagManagerId: null,
  metaPixelId: null,
  robotsTxtExtra: null,
};

/** Panel-published overrides live alongside the rest of the site settings. */
const published = (genSite ?? {}) as Partial<GlobalSeo> & { seo?: Partial<GlobalSeo> };

export const globalSeo: GlobalSeo = {
  ...fallbackGlobalSeo,
  ...(published.seo ?? {}),
};

/** Absolute URL for any site-relative path. Already-absolute input passes through. */
export function absoluteUrl(pathOrUrl?: string | null): string | undefined {
  const v = pathOrUrl?.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  return `${SITE_URL}${v.startsWith("/") ? "" : "/"}${v}`;
}
