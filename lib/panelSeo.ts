import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import type { GlobalSeo } from "@/types";
import { globalSeo as fallbackSeo } from "@/data/seo";

/**
 * Global SEO settings, stored beside the brand settings in the same key/value
 * `settings` table (`skey = 'seo'`).
 *
 * A row that has never been saved falls back to the values compiled into
 * data/seo.ts, so the site behaves identically before and after the first save
 * — no "unconfigured" state where pages ship without a title.
 */

export async function getGlobalSeo(): Promise<GlobalSeo> {
  try {
    const pool = getPanelPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT svalue FROM `settings` WHERE skey = 'seo' LIMIT 1"
    );
    if (rows.length && rows[0].svalue) {
      return { ...fallbackSeo, ...JSON.parse(rows[0].svalue as string) };
    }
  } catch {
    /* not installed yet — fall through to the compiled defaults */
  }
  return fallbackSeo;
}

export async function saveGlobalSeo(seo: GlobalSeo): Promise<void> {
  const pool = getPanelPool();
  await pool.query(
    "INSERT INTO `settings` (skey, svalue, updated_at) VALUES ('seo', ?, ?) " +
      "ON DUPLICATE KEY UPDATE svalue = VALUES(svalue), updated_at = VALUES(updated_at)",
    [JSON.stringify(seo), new Date().toISOString()]
  );
}
