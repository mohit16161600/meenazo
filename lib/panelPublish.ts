import { writeFile } from "node:fs/promises";
import path from "node:path";
import { MODELS } from "./panelModels";
import { listRows } from "./panelCrud";
import { getSiteConfig } from "./panelSettings";
import { getGlobalSeo } from "./panelSeo";
import { revalidateCatalog } from "./catalog";

/**
 * Publish — copy the panel database out to the snapshot files the storefront
 * imports (`data/generated/*.json`).
 *
 * The site never queries MySQL at request time: every `data/*.ts` module
 * prefers its published snapshot and falls back to the hardcoded catalogue when
 * the snapshot is empty. That is what keeps the storefront fully static and
 * fast — but it also means an edit in the panel is invisible on the website
 * until it is published. This is the step that closes that gap.
 *
 * Writing an EMPTY table would blank that section of the site, so a table with
 * no rows is skipped and its snapshot left untouched — the fallback data keeps
 * serving. Publishing can add and update, never silently empty the shop.
 */

const OUT_DIR = path.join(process.cwd(), "data", "generated");

/** Model → snapshot file. Only these are consumed by the storefront. */
const SNAPSHOTS: { model: keyof typeof MODELS; file: string }[] = [
  { model: "products", file: "products.json" },
  { model: "categories", file: "categories.json" },
  { model: "blog", file: "blog.json" },
  { model: "coupons", file: "coupons.json" },
  { model: "faqs", file: "faqs.json" },
  { model: "banners", file: "banners.json" },
  { model: "testimonials", file: "testimonials.json" },
];

export interface PublishReport {
  /** file → rows written */
  written: Record<string, number>;
  /** Files skipped because the table was empty (fallback data kept). */
  skipped: string[];
  publishedAt: string;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await writeFile(path.join(OUT_DIR, file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function runPublish(): Promise<PublishReport> {
  const written: Record<string, number> = {};
  const skipped: string[] = [];

  for (const { model, file } of SNAPSHOTS) {
    const def = MODELS[model];
    if (!def) continue;

    // No `limit` at all — listRows only adds a LIMIT clause when one is passed,
    // so this reads the whole table. (Passing 0 would clamp to 1.)
    const { items } = await listRows(def);
    if (!items.length) {
      skipped.push(file);
      continue;
    }
    await writeJson(file, items);
    written[file] = items.length;
  }

  // Site config carries the global SEO block alongside the brand settings, so
  // one file feeds both `data/site.ts` and `data/seo.ts`.
  const site = await getSiteConfig();
  const seo = await getGlobalSeo();
  await writeJson("site.json", { ...site, seo });
  written["site.json"] = 1;

  const publishedAt = new Date().toISOString();
  await writeJson("_published.json", { publishedAt, written, skipped });

  // Drop the cached catalogue so the very next page view re-reads the database.
  // The JSON files above are still written — they are the build-time fallback
  // and what a fresh deploy starts from — but the LIVE site no longer waits for
  // a rebuild to pick prices up. Never fatal: a publish that wrote its files is
  // a successful publish even if the cache refuses to clear.
  try {
    revalidateCatalog();
  } catch (err) {
    console.error("[publish] catalog cache revalidation failed:", (err as Error)?.message);
  }

  return { written, skipped, publishedAt };
}
