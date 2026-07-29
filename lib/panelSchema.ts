import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getPanelPool, createServerConnection, PANEL_DB } from "./panelDb";
import { MODELS, type Model } from "./panelModels";
import { ddlForModel, buildInsert, columnDefinition } from "./panelMap";
import { hashPassword } from "./panelAuth";

// Live site data — the panel DB is seeded to be an exact copy on first install.
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { blogPosts } from "@/data/blog";
import { coupons } from "@/data/coupons";
import { banners } from "@/data/banners";
import { testimonials } from "@/data/testimonials";
import { generalFaq } from "@/data/faq";
import { siteConfig } from "@/data/site";

const now = () => new Date().toISOString();

export interface SetupReport {
  createdDatabase: boolean;
  tables: string[];
  /** Columns added to already-existing tables by the idempotent migration. */
  migratedColumns: Record<string, string[]>;
  seeded: Record<string, number>;
  adminCreated: boolean;
  adminEmail: string;
  adminPassword?: string; // only returned when a fresh admin was created
}

/**
 * The default admin is SEEDED into the `admin_users` DB table on first install
 * (see ensureAdmin) — after that the DB row is the source of truth, not this
 * object. Credentials come from env so no password is hardcoded in source;
 * the values below are only the fallback for a stock local dev install.
 */
/**
 * The seeded password must never be a publicly-known constant on a live site:
 * the panel login is reachable from the internet, so `meenazo123` plus the
 * default email is a complete takeover. In production an unset
 * PANEL_ADMIN_PASSWORD gets a strong random one instead, returned ONCE in the
 * setup report for the owner to save.
 */
function defaultAdminPassword(): string {
  const fromEnv = (process.env.PANEL_ADMIN_PASSWORD ?? "").trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    return randomBytes(12).toString("base64url"); // ~16 chars, unguessable
  }
  return "meenazo123"; // local dev convenience only
}

export const DEFAULT_ADMIN = {
  name: process.env.PANEL_ADMIN_NAME || "Administrator",
  email: (process.env.PANEL_ADMIN_EMAIL || "admin@meenazo.com").toLowerCase(),
  password: defaultAdminPassword(),
  role: "admin",
};

/** Create the database if it doesn't exist yet. Returns true if it created it. */
async function ensureDatabase(): Promise<boolean> {
  const conn = await createServerConnection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = ?",
      [PANEL_DB.database]
    );
    const exists = rows.length > 0;
    if (!exists) {
      await conn.query(
        `CREATE DATABASE \`${PANEL_DB.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    }
    return !exists;
  } finally {
    await conn.end();
  }
}

/** Create every model table + the key/value settings table. */
async function ensureTables(): Promise<string[]> {
  const pool = getPanelPool();
  const created: string[] = [];
  for (const model of Object.values(MODELS)) {
    await pool.query(ddlForModel(model));
    created.push(model.table);
  }
  await pool.query(
    "CREATE TABLE IF NOT EXISTS `settings` (`skey` VARCHAR(64) NOT NULL, `svalue` LONGTEXT NULL, `updated_at` VARCHAR(40) NULL, PRIMARY KEY (`skey`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
  created.push("settings");
  // Atomic source for sequential order numbers (mpl0001, mpl0002, …).
  await pool.query(
    "CREATE TABLE IF NOT EXISTS `order_sequence` (`id` BIGINT NOT NULL AUTO_INCREMENT, `order_id` VARCHAR(64) NULL, `created_at` VARCHAR(40) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
  created.push("order_sequence");
  return created;
}

/**
 * Idempotent column migration: add any model field that's missing from an
 * already-created table (CREATE TABLE IF NOT EXISTS never alters existing
 * tables). Lets schema additions — e.g. the plaintext `password` column, or the
 * earlier products.variants / orders.crm_synced — land on an existing install
 * by just re-running setup. Never drops or changes existing columns.
 */
async function ensureColumns(model: Model): Promise<string[]> {
  const pool = getPanelPool();
  const [cols] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = ? AND table_name = ?",
    [PANEL_DB.database, model.table]
  );
  const existing = new Set(cols.map((c) => String(c.COLUMN_NAME).toLowerCase()));
  const added: string[] = [];
  for (const f of model.fields) {
    if (f.col === model.pkCol) continue;
    if (existing.has(f.col.toLowerCase())) continue;
    await pool.query(`ALTER TABLE \`${model.table}\` ADD COLUMN ${columnDefinition(f)}`);
    added.push(f.col);
  }
  return added;
}

/** Add any unique/regular indexes declared on the model but missing from the table. */
async function ensureIndexes(model: Model): Promise<string[]> {
  const pool = getPanelPool();
  const [idx] = await pool.query<RowDataPacket[]>(
    "SELECT INDEX_NAME FROM information_schema.statistics WHERE table_schema = ? AND table_name = ?",
    [PANEL_DB.database, model.table]
  );
  const existing = new Set(idx.map((r) => String(r.INDEX_NAME).toLowerCase()));
  const added: string[] = [];
  for (const f of model.fields) {
    if (f.col === model.pkCol) continue;
    const isUnique = Boolean(f.unique);
    if (!isUnique && !f.index) continue;
    const name = `${isUnique ? "uq" : "ix"}_${model.table}_${f.col}`;
    if (existing.has(name.toLowerCase())) continue;
    try {
      await pool.query(
        `ALTER TABLE \`${model.table}\` ADD ${isUnique ? "UNIQUE " : ""}KEY \`${name}\` (\`${f.col}\`)`
      );
      added.push(name);
    } catch (err) {
      // e.g. duplicate values blocking a new UNIQUE — log, don't fail setup.
      console.error(`[setup] add index ${name} failed:`, (err as Error)?.message);
    }
  }
  return added;
}

async function migrateColumns(): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const model of Object.values(MODELS)) {
    try {
      const added = [...(await ensureColumns(model)), ...(await ensureIndexes(model))];
      if (added.length) out[model.table] = added;
    } catch (err) {
      console.error(`[setup] migration failed for ${model.table}:`, err);
    }
  }
  return out;
}

async function rowCount(table: string): Promise<number> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM \`${table}\``
  );
  return Number(rows[0]?.n ?? 0);
}

/** Insert an array of API-shaped objects into a model's table. */
async function seedModel(
  model: Model,
  items: Record<string, unknown>[]
): Promise<number> {
  if ((await rowCount(model.table)) > 0) return 0;
  const pool = getPanelPool();
  const stamp = now();
  let n = 0;
  for (const item of items) {
    const { sql, values } = buildInsert(model, item, stamp);
    await pool.query(sql, values);
    n++;
  }
  return n;
}

/** Seed all content tables from the live site data (only when empty). */
async function seedContent(): Promise<Record<string, number>> {
  const seeded: Record<string, number> = {};

  seeded.products = await seedModel(
    MODELS.products,
    products as unknown as Record<string, unknown>[]
  );

  // strip runtime-derived helpers off categories, keep plain fields
  seeded.categories = await seedModel(
    MODELS.categories,
    categories.map((c) => ({ ...c })) as unknown as Record<string, unknown>[]
  );

  seeded.blog = await seedModel(
    MODELS.blog,
    blogPosts as unknown as Record<string, unknown>[]
  );

  seeded.coupons = await seedModel(
    MODELS.coupons,
    coupons as unknown as Record<string, unknown>[]
  );

  seeded.banners = await seedModel(
    MODELS.banners,
    banners.map((b, i) => ({ ...b, sortOrder: i + 1, active: true })) as unknown as Record<
      string,
      unknown
    >[]
  );

  seeded.testimonials = await seedModel(
    MODELS.testimonials,
    testimonials.map((t, i) => ({ ...t, sortOrder: i + 1 })) as unknown as Record<
      string,
      unknown
    >[]
  );

  seeded.faqs = await seedModel(
    MODELS.faqs,
    generalFaq.map((f, i) => ({
      id: `faq-${i + 1}`,
      question: f.question,
      answer: f.answer,
      category: "General",
      sortOrder: i + 1,
    }))
  );

  return seeded;
}

/** Store the site config JSON under the `site` settings key (if not already set). */
async function seedSettings(): Promise<void> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT skey FROM `settings` WHERE skey = 'site'"
  );
  if (rows.length === 0) {
    await pool.query(
      "INSERT INTO `settings` (skey, svalue, updated_at) VALUES ('site', ?, ?)",
      [JSON.stringify(siteConfig), now()]
    );
  }
}

/** Create the default admin user if there are none yet. */
async function ensureAdmin(): Promise<{ created: boolean }> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM `admin_users`"
  );
  if (Number(rows[0]?.n ?? 0) > 0) return { created: false };

  const stamp = now();
  const { sql, values } = buildInsert(
    MODELS.users,
    {
      id: `u-${Date.now()}`,
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      // Plaintext (viewable in panel/DB) + scrypt hash fallback.
      password: DEFAULT_ADMIN.password,
      passwordHash: hashPassword(DEFAULT_ADMIN.password),
      role: DEFAULT_ADMIN.role,
      active: true,
    },
    stamp
  );
  await pool.query(sql, values);
  return { created: true };
}

/**
 * Full idempotent install: create DB, tables, seed content + settings, and a
 * default admin. Safe to run multiple times — nothing is overwritten.
 */
export async function runSetup(): Promise<SetupReport> {
  const createdDatabase = await ensureDatabase();
  const tables = await ensureTables();
  const migratedColumns = await migrateColumns();
  const seeded = await seedContent();
  await seedSettings();
  const admin = await ensureAdmin();

  return {
    createdDatabase,
    tables,
    migratedColumns,
    seeded,
    adminCreated: admin.created,
    adminEmail: DEFAULT_ADMIN.email,
    adminPassword: admin.created ? DEFAULT_ADMIN.password : undefined,
  };
}
