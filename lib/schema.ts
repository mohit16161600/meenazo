import type { BlogPost, FAQItem, Product, Review } from "@/types";
import { siteConfig, SITE_URL } from "@/data/site";
import { globalSeo, absoluteUrl } from "@/data/seo";

/**
 * JSON-LD generators.
 *
 * Everything Google reads about this site is built here, from the same data the
 * pages render — so structured data can never drift from what a visitor sees,
 * which is exactly what earns a rich-result penalty.
 *
 * Undefined branches are stripped before output: an incomplete property is
 * worse than an absent one, because Google flags it as an error.
 */

type Json = Record<string, unknown>;

/** Drop undefined/null/empty values so no half-filled property ships. */
function clean<T extends Json>(obj: T): T {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

/* ----------------------------- Organization ---------------------------- */

export function organizationJsonLd(): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: siteConfig.name,
    url: SITE_URL,
    logo: absoluteUrl(siteConfig.logoImage ?? globalSeo.defaultOgImage),
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: clean({
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressCountry: "IN",
    }),
    sameAs: siteConfig.social?.map((s) => s.href) ?? [],
  });
}

/* -------------------------------- WebSite ------------------------------- */

/** Enables the sitelinks search box in Google results. */
export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: siteConfig.name,
    publisher: { "@id": `${SITE_URL}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ------------------------------ LocalBusiness --------------------------- */

export function localBusinessJsonLd(): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}#localbusiness`,
    name: siteConfig.name,
    url: SITE_URL,
    image: absoluteUrl(siteConfig.logoImage ?? globalSeo.defaultOgImage),
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: clean({
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressCountry: "IN",
    }),
    priceRange: "₹₹",
  });
}

/* -------------------------------- Product ------------------------------- */

export function productJsonLd(p: {
  name: string;
  description: string;
  slug: string;
  price: number;
  rating: number;
  reviewCount: number;
  stock: number;
  images?: string[];
  sku?: string | null;
  brand?: string;
}): Json {
  const url = `${SITE_URL}/product/${p.slug}`;
  return clean({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    description: p.description,
    url,
    sku: p.sku ?? undefined,
    image: (p.images ?? []).map((i) => absoluteUrl(i)).filter(Boolean),
    brand: { "@type": "Brand", name: p.brand || siteConfig.name },
    // Only claim an aggregate rating when there is something to aggregate —
    // a rating with zero reviews is a structured-data error.
    aggregateRating:
      p.reviewCount > 0 && p.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: p.rating,
            reviewCount: p.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: siteConfig.currency ?? "INR",
      availability:
        p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
      seller: { "@id": `${SITE_URL}#organization` },
    },
  });
}

/** Individual customer reviews, attached to a product. */
export function reviewsJsonLd(product: Product): Json[] {
  return (product.reviews ?? []).map((r: Review) =>
    clean({
      "@context": "https://schema.org",
      "@type": "Review",
      itemReviewed: { "@id": `${SITE_URL}/product/${product.slug}#product` },
      author: { "@type": "Person", name: r.author },
      datePublished: r.date,
      name: r.title,
      reviewBody: r.comment,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })
  );
}

/* ---------------------------------- FAQ --------------------------------- */

export function faqJsonLd(items: FAQItem[]): Json | null {
  const valid = items.filter((f) => f.question?.trim() && f.answer?.trim());
  if (!valid.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/* ------------------------------ Breadcrumbs ----------------------------- */

export function breadcrumbJsonLd(trail: { label: string; href?: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };
}

/* ------------------------------ BlogPosting ----------------------------- */

export function blogPostingJsonLd(post: BlogPost): Json {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return clean({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    image: absoluteUrl(post.image),
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: { "@id": `${SITE_URL}#organization` },
    keywords: post.tags?.join(", "),
  });
}

/** Same shape as BlogPosting but typed as a generic Article. */
export function articleJsonLd(post: BlogPost): Json {
  return { ...blogPostingJsonLd(post), "@type": "Article" };
}

/**
 * Wrap several graphs into one @graph block so a page emits a single script
 * tag instead of five competing ones.
 */
export function graph(...nodes: (Json | Json[] | null | undefined)[]): Json {
  const flat = nodes.flat().filter(Boolean) as Json[];
  return {
    "@context": "https://schema.org",
    "@graph": flat.map(({ "@context": _ctx, ...rest }) => rest),
  };
}
