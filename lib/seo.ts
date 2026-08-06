import type { Metadata } from "next";
import type { SeoFields } from "@/types";
import { siteConfig, SITE_URL } from "@/data/site";
import { globalSeo, absoluteUrl } from "@/data/seo";

/**
 * One metadata builder for the whole site.
 *
 * Resolution order for every field is the same and deliberate:
 *   the entity's own SEO override  →  the page's natural content  →  the
 *   global default  →  brand copy.
 * An empty field therefore means "inherit", never "publish a blank tag", so a
 * page nobody has edited still ships a sensible title, description and card.
 */

/** Brand the title exactly once. */
function brandTitle(title: string): string {
  const suffix = globalSeo.titleSuffix?.trim() || siteConfig.name;
  if (!suffix) return title;
  return title.toLowerCase().includes(suffix.toLowerCase()) ? title : `${title} | ${suffix}`;
}

/** Turn "index, follow" into the object Next's Metadata API expects. */
function parseRobots(value?: string | null): Metadata["robots"] {
  const raw = (value ?? globalSeo.robots ?? "index, follow").toLowerCase();
  const has = (t: string) => raw.includes(t);
  return {
    index: !has("noindex"),
    follow: !has("nofollow"),
    googleBot: {
      index: !has("noindex"),
      follow: !has("nofollow"),
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export interface SeoInput extends SeoFields {
  /** The page's own heading — used when `seoTitle` is blank. */
  title?: string;
  /** The page's own summary — used when `seoDescription` is blank. */
  description?: string;
  /** Site-relative path, e.g. "/product/diasuddhi". */
  path?: string;
  /** The page's main image — used when `ogImage` is blank. */
  image?: string | null;
  /** "website" for pages, "article" for blog posts. */
  type?: "website" | "article";
  /** Article-only Open Graph extras. */
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}

export function buildSeoMetadata(input: SeoInput): Metadata {
  const {
    title,
    description,
    path = "/",
    image,
    type = "website",
    publishedTime,
    modifiedTime,
    authors,
  } = input;

  const resolvedTitle = brandTitle(
    input.seoTitle?.trim() || title?.trim() || globalSeo.seoTitle?.trim() || siteConfig.name
  );
  const resolvedDescription =
    input.seoDescription?.trim() ||
    description?.trim() ||
    globalSeo.seoDescription?.trim() ||
    siteConfig.description;

  const url = `${SITE_URL}${path}`;
  // A blank canonical means "this page is the canonical one" — the common and
  // correct case. Only an explicit override points somewhere else.
  const canonical = absoluteUrl(input.canonicalUrl) ?? url;

  const keywords = (input.seoKeywords?.length ? input.seoKeywords : globalSeo.seoKeywords) ?? [];

  const ogImage =
    absoluteUrl(input.ogImage) ?? absoluteUrl(image) ?? absoluteUrl(globalSeo.defaultOgImage);
  const twitterImage = absoluteUrl(input.twitterImage) ?? ogImage;

  const ogTitle = input.ogTitle?.trim() || resolvedTitle;
  const ogDescription = input.ogDescription?.trim() || resolvedDescription;

  return {
    title: { absolute: resolvedTitle },
    description: resolvedDescription,
    keywords: keywords.length ? keywords : undefined,
    robots: parseRobots(input.robots),
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      siteName: siteConfig.name,
      type,
      locale: "en_IN",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }] : undefined,
      ...(type === "article"
        ? { publishedTime, modifiedTime, authors }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: globalSeo.twitterSite ?? undefined,
      title: input.twitterTitle?.trim() || ogTitle,
      description: input.twitterDescription?.trim() || ogDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
    verification: {
      google: globalSeo.googleSiteVerification ?? undefined,
      other: {
        ...(globalSeo.bingSiteVerification
          ? { "msvalidate.01": globalSeo.bingSiteVerification }
          : {}),
        ...(globalSeo.facebookDomainVerification
          ? { "facebook-domain-verification": globalSeo.facebookDomainVerification }
          : {}),
        ...(globalSeo.pinterestVerification
          ? { "p:domain_verify": globalSeo.pinterestVerification }
          : {}),
      },
    },
  };
}

/**
 * Older call sites pass a plain title/description/path. Kept as a thin wrapper
 * so nothing had to change at once, and so there is still exactly one place
 * that decides what a tag looks like.
 */
export function buildMetadata(args: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  return buildSeoMetadata(args);
}

/** Helper to render a JSON-LD <script> safely. */
export function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data) };
}

export { organizationJsonLd, productJsonLd } from "./schema";
