/**
 * Live SEO analyzer — the engine behind the panel's score badge.
 *
 * Pure functions with no DOM and no imports, so the exact same checks run in
 * the editor as the writer types and on the server when auditing a page. A
 * score that only exists in the browser is a score nobody can verify.
 *
 * Weighting follows what actually moves rankings today: title and description
 * quality first, focus keyword placement second, structure (headings, links,
 * alt text) third. Keyword *density* is scored gently on purpose — stuffing is
 * penalised by search engines, so a "perfect" density is not the goal.
 */

export type CheckStatus = "good" | "warn" | "bad";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** What the writer should actually do about it. */
  message: string;
  /** Contribution to the final score when passed. */
  weight: number;
}

export interface SeoAnalysis {
  score: number; // 0-100
  grade: "excellent" | "good" | "needs-work" | "poor";
  checks: SeoCheck[];
  stats: {
    titleLength: number;
    descriptionLength: number;
    wordCount: number;
    charCount: number;
    readingTimeMin: number;
    keywordDensity: number; // percent
    headings: Record<string, number>;
    internalLinks: number;
    externalLinks: number;
    images: number;
    imagesMissingAlt: number;
    readability: number; // 0-100, higher = easier
  };
}

export interface AnalyzerInput {
  title?: string | null;
  description?: string | null;
  /** Article/product body as HTML. */
  content?: string | null;
  focusKeyword?: string | null;
  slug?: string | null;
  /** Whether an OG/social image is set. */
  hasImage?: boolean;
}

/* ------------------------------- helpers -------------------------------- */

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

/**
 * Flesch Reading Ease, clamped to 0-100. ~60+ reads comfortably for a general
 * audience, which is the right target for wellness content.
 */
function readingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const ws = words(text);
  if (!ws.length) return 0;
  const syllables = ws.reduce((n, w) => n + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (ws.length / sentences) - 84.6 * (syllables / ws.length);
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Case-insensitive whole-phrase occurrences. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle.trim()) return 0;
  const escaped = needle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (haystack.match(new RegExp(escaped, "gi")) ?? []).length;
}

/* ------------------------------- analysis ------------------------------- */

export function analyzeSeo(input: AnalyzerInput): SeoAnalysis {
  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim();
  const html = input.content ?? "";
  const text = stripHtml(html);
  const keyword = (input.focusKeyword ?? "").trim();
  const slug = (input.slug ?? "").trim();

  const ws = words(text);
  const wordCount = ws.length;

  const headings: Record<string, number> = {};
  for (const m of html.matchAll(/<h([1-6])[^>]*>/gi)) {
    const tag = `h${m[1]}`;
    headings[tag] = (headings[tag] ?? 0) + 1;
  }

  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const externalLinks = links.filter((h) => /^https?:\/\//i.test(h)).length;
  const internalLinks = links.length - externalLinks;

  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imagesMissingAlt = imgTags.filter((t) => !/\balt=["'][^"']+["']/i.test(t)).length;

  const keywordHits = keyword ? countOccurrences(text, keyword) : 0;
  const keywordDensity = wordCount > 0 ? (keywordHits / wordCount) * 100 : 0;
  const readability = readingEase(text);

  const checks: SeoCheck[] = [];
  const add = (
    id: string,
    label: string,
    status: CheckStatus,
    message: string,
    weight: number
  ) => checks.push({ id, label, status, message, weight });

  /* --- Title --- */
  if (!title) {
    add("title", "Meta title", "bad", "No title set — search results will use whatever Google picks.", 15);
  } else if (title.length < TITLE_MIN) {
    add("title", "Meta title", "warn", `Only ${title.length} characters. Aim for ${TITLE_MIN}–${TITLE_MAX}.`, 15);
  } else if (title.length > TITLE_MAX) {
    add("title", "Meta title", "warn", `${title.length} characters — Google will cut it off after about ${TITLE_MAX}.`, 15);
  } else {
    add("title", "Meta title", "good", `${title.length} characters — fits the search result.`, 15);
  }

  /* --- Description --- */
  if (!description) {
    add("description", "Meta description", "bad", "No description — Google will scrape a random sentence instead.", 15);
  } else if (description.length < DESC_MIN) {
    add("description", "Meta description", "warn", `Only ${description.length} characters. ${DESC_MIN}–${DESC_MAX} uses the full snippet.`, 15);
  } else if (description.length > DESC_MAX) {
    add("description", "Meta description", "warn", `${description.length} characters — the tail will be truncated.`, 15);
  } else {
    add("description", "Meta description", "good", `${description.length} characters — uses the full snippet.`, 15);
  }

  /* --- Focus keyword --- */
  if (!keyword) {
    add("focus", "Focus keyword", "warn", "Set the phrase this page should rank for to unlock keyword checks.", 10);
  } else {
    const inTitle = countOccurrences(title, keyword) > 0;
    const inDesc = countOccurrences(description, keyword) > 0;
    const inSlug = slug ? slug.toLowerCase().includes(keyword.toLowerCase().replace(/\s+/g, "-")) : false;
    const inFirst = countOccurrences(ws.slice(0, 100).join(" "), keyword) > 0;

    add(
      "focus-title",
      "Keyword in title",
      inTitle ? "good" : "bad",
      inTitle ? "Focus keyword appears in the title." : "Add the focus keyword to the title.",
      10
    );
    add(
      "focus-desc",
      "Keyword in description",
      inDesc ? "good" : "warn",
      inDesc ? "Focus keyword appears in the description." : "Work the focus keyword into the description.",
      6
    );
    add(
      "focus-slug",
      "Keyword in URL",
      inSlug ? "good" : "warn",
      inSlug ? "Focus keyword appears in the slug." : "Consider putting the keyword in the URL slug.",
      5
    );
    add(
      "focus-intro",
      "Keyword in opening",
      inFirst ? "good" : "warn",
      inFirst ? "Focus keyword appears early in the body." : "Mention the keyword in the first 100 words.",
      6
    );

    if (keywordHits === 0) {
      add("density", "Keyword density", "bad", "The focus keyword never appears in the body.", 8);
    } else if (keywordDensity > 3) {
      add("density", "Keyword density", "bad", `${keywordDensity.toFixed(1)}% — that reads as stuffing. Keep it under 3%.`, 8);
    } else if (keywordDensity < 0.4) {
      add("density", "Keyword density", "warn", `${keywordDensity.toFixed(1)}% — a little light. 0.5–2% is comfortable.`, 8);
    } else {
      add("density", "Keyword density", "good", `${keywordDensity.toFixed(1)}% — natural.`, 8);
    }
  }

  /* --- Content length --- */
  if (wordCount === 0) {
    add("length", "Content length", "bad", "No body content yet.", 10);
  } else if (wordCount < 300) {
    add("length", "Content length", "warn", `${wordCount} words. Under 300 rarely ranks — aim for 600+.`, 10);
  } else if (wordCount < 600) {
    add("length", "Content length", "warn", `${wordCount} words. Solid, but 600+ competes better.`, 10);
  } else {
    add("length", "Content length", "good", `${wordCount} words.`, 10);
  }

  /* --- Heading structure --- */
  const h1 = headings.h1 ?? 0;
  const subs = (headings.h2 ?? 0) + (headings.h3 ?? 0);
  if (h1 > 0) {
    add("headings", "Heading structure", "warn", `${h1} H1 in the body — the page title is already the H1. Use H2/H3.`, 8);
  } else if (subs === 0 && wordCount > 300) {
    add("headings", "Heading structure", "warn", "No H2/H3 headings — long text without subheadings is hard to scan.", 8);
  } else {
    add("headings", "Heading structure", "good", `${subs} subheading${subs === 1 ? "" : "s"}.`, 8);
  }

  /* --- Links --- */
  if (internalLinks === 0) {
    add("internal-links", "Internal links", "warn", "No internal links — link to a related product or article.", 5);
  } else {
    add("internal-links", "Internal links", "good", `${internalLinks} internal link${internalLinks === 1 ? "" : "s"}.`, 5);
  }

  /* --- Image alt text --- */
  if (imgTags.length === 0) {
    add("images", "Images", "warn", "No images in the body — one relevant image helps engagement.", 5);
  } else if (imagesMissingAlt > 0) {
    add("images", "Image alt text", "bad", `${imagesMissingAlt} of ${imgTags.length} images have no alt text.`, 5);
  } else {
    add("images", "Image alt text", "good", `All ${imgTags.length} images have alt text.`, 5);
  }

  /* --- Social image --- */
  add(
    "social-image",
    "Social share image",
    input.hasImage ? "good" : "warn",
    input.hasImage ? "A share image is set." : "No share image — links will preview as plain text.",
    5
  );

  /* --- URL --- */
  if (!slug) {
    add("url", "URL slug", "warn", "No slug set.", 4);
  } else if (slug.length > 75) {
    add("url", "URL slug", "warn", `${slug.length} characters — shorter slugs are easier to share.`, 4);
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    add("url", "URL slug", "bad", "Use lowercase letters, numbers and hyphens only.", 4);
  } else {
    add("url", "URL slug", "good", "Clean, readable slug.", 4);
  }

  /* --- Readability --- */
  if (wordCount < 50) {
    add("readability", "Readability", "warn", "Too little text to judge.", 8);
  } else if (readability < 40) {
    add("readability", "Readability", "warn", `Reads as difficult (${readability}/100). Shorter sentences help.`, 8);
  } else if (readability < 60) {
    add("readability", "Readability", "good", `Fairly easy to read (${readability}/100).`, 8);
  } else {
    add("readability", "Readability", "good", `Easy to read (${readability}/100).`, 8);
  }

  /* ------------------------------ scoring ------------------------------ */

  const totalWeight = checks.reduce((n, c) => n + c.weight, 0) || 1;
  const earned = checks.reduce(
    (n, c) => n + (c.status === "good" ? c.weight : c.status === "warn" ? c.weight * 0.5 : 0),
    0
  );
  const score = Math.round((earned / totalWeight) * 100);

  return {
    score,
    grade: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs-work" : "poor",
    checks,
    stats: {
      titleLength: title.length,
      descriptionLength: description.length,
      wordCount,
      charCount: text.length,
      readingTimeMin: Math.max(1, Math.round(wordCount / 200)),
      keywordDensity: Number(keywordDensity.toFixed(2)),
      headings,
      internalLinks,
      externalLinks,
      images: imgTags.length,
      imagesMissingAlt,
      readability,
    },
  };
}

/** Turn any text into a clean URL slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
