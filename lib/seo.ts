import type { Metadata } from "next";
import { siteConfig, SITE_URL } from "@/data/site";

/** Build consistent page metadata (title template, OG, Twitter). */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  // Brand the title exactly once: skip the suffix if the caller already includes
  // the brand name (e.g. product seoTitle), and use `absolute` so the root layout's
  // `%s | Meenazo` template doesn't append it a second time.
  const fullTitle = !title
    ? `${siteConfig.name} — ${siteConfig.tagline}`
    : title.includes(siteConfig.name)
      ? title
      : `${title} | ${siteConfig.name}`;
  const desc = description ?? siteConfig.description;
  const url = `${SITE_URL}${path}`;
  return {
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: siteConfig.name,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
  };
}

/** Organization JSON-LD for the home page. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: SITE_URL,
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: { "@type": "PostalAddress", streetAddress: siteConfig.address },
    sameAs: siteConfig.social.map((s) => s.href),
  };
}

/** Product JSON-LD for product detail pages. */
export function productJsonLd(p: {
  name: string;
  description: string;
  slug: string;
  price: number;
  rating: number;
  reviewCount: number;
  stock: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    url: `${SITE_URL}/product/${p.slug}`,
    brand: { "@type": "Brand", name: siteConfig.name },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
    },
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: siteConfig.currency,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${p.slug}`,
    },
  };
}

/** Helper to render a JSON-LD <script> safely. */
export function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data) };
}
