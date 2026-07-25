import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import { siteConfig as fallbackConfig } from "@/data/site";
import type { SiteConfig } from "@/types";

/** Read the editable site config from the settings table (falls back to code). */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const pool = getPanelPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT svalue FROM `settings` WHERE skey = 'site' LIMIT 1"
    );
    if (rows.length && rows[0].svalue) {
      return { ...fallbackConfig, ...JSON.parse(rows[0].svalue as string) };
    }
  } catch {
    /* not installed yet — fall through */
  }
  return fallbackConfig;
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  const pool = getPanelPool();
  await pool.query(
    "INSERT INTO `settings` (skey, svalue, updated_at) VALUES ('site', ?, ?) " +
      "ON DUPLICATE KEY UPDATE svalue = VALUES(svalue), updated_at = VALUES(updated_at)",
    [JSON.stringify(config), new Date().toISOString()]
  );
}
