import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPanelPool, PANEL_DB } from "./panelDb";

/**
 * Sequential human order numbers — MPL0001, MPL0002, MPL0003 …
 * ---------------------------------------------------------------------------
 * Backed by a dedicated AUTO_INCREMENT table so the sequence is atomic and
 * race-free (unlike MAX()+1). Each order takes one row; its insertId is the
 * running number. Formatted `MPL` + 4-digit zero-padded (widens past 9999).
 * The prefix is ALWAYS uppercase (owner's requirement). Lookups stay
 * case-insensitive (utf8mb4_unicode_ci), so older lowercase mpl#### rows keep
 * resolving fine.
 *
 * `ensureOrderInfra()` is self-migrating: it creates the sequence table and
 * backfills the EasyEcom/dispatch columns onto already-installed `orders` /
 * `products` tables, so the new order pipeline works without a manual setup
 * re-run. It does the real work once per process (cached promise).
 */

const PREFIX = "MPL";

let infraReady: Promise<void> | null = null;

async function columnExists(table: string, column: string): Promise<boolean> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ? LIMIT 1",
    [PANEL_DB.database, table, column]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(table: string, column: string, ddl: string): Promise<void> {
  if (await columnExists(table, column)) return;
  const pool = getPanelPool();
  try {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  } catch (err) {
    // A concurrent add or a not-yet-created table — safe to ignore; the order
    // pipeline degrades gracefully and setup will reconcile the schema.
    console.error(`[orderNumber] add ${table}.${column} failed:`, (err as Error)?.message);
  }
}

/** Create the sequence table + backfill integration columns (idempotent, cached). */
export function ensureOrderInfra(): Promise<void> {
  if (infraReady) return infraReady;
  infraReady = (async () => {
    const pool = getPanelPool();
    await pool.query(
      "CREATE TABLE IF NOT EXISTS `order_sequence` (" +
        "`id` BIGINT NOT NULL AUTO_INCREMENT, " +
        "`order_id` VARCHAR(64) NULL, " +
        "`created_at` VARCHAR(40) NULL, " +
        "PRIMARY KEY (`id`)" +
        ") ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    await addColumnIfMissing("products", "sku", "`sku` VARCHAR(64) NULL");
    await addColumnIfMissing("orders", "shipping_phone", "`shipping_phone` VARCHAR(32) NULL");
    await addColumnIfMissing("orders", "easyecom_synced", "`easyecom_synced` TINYINT(1) NOT NULL DEFAULT 0");
    await addColumnIfMissing("orders", "easyecom_ref", "`easyecom_ref` VARCHAR(255) NULL");
    await addColumnIfMissing("orders", "dispatch_at", "`dispatch_at` VARCHAR(40) NULL");
    await addColumnIfMissing("orders", "easyecom_pushed_at", "`easyecom_pushed_at` VARCHAR(40) NULL");
    await addColumnIfMissing("orders", "easyecom_attempts", "`easyecom_attempts` INT NULL");
    await addColumnIfMissing("orders", "easyecom_error", "`easyecom_error` LONGTEXT NULL");
    await addColumnIfMissing("orders", "easyecom_log", "`easyecom_log` LONGTEXT NULL");
    await addColumnIfMissing("orders", "easyecom_order_id", "`easyecom_order_id` VARCHAR(255) NULL");
    await addColumnIfMissing("orders", "fulfillment_status", "`fulfillment_status` VARCHAR(255) NULL");
    await addColumnIfMissing("orders", "shipment_status_at", "`shipment_status_at` VARCHAR(40) NULL");
    await addColumnIfMissing("orders", "tracking_number", "`tracking_number` VARCHAR(128) NULL");
    await addColumnIfMissing("orders", "courier", "`courier` VARCHAR(255) NULL");
    await addColumnIfMissing("orders", "tracking_url", "`tracking_url` LONGTEXT NULL");
    await addColumnIfMissing("orders", "ndr_reason", "`ndr_reason` LONGTEXT NULL");
    await addColumnIfMissing("orders", "status_history", "`status_history` LONGTEXT NULL");
    await addColumnIfMissing("orders", "webhook_raw", "`webhook_raw` LONGTEXT NULL");
  })().catch((err) => {
    // Reset so a transient failure can be retried on the next order.
    infraReady = null;
    throw err;
  });
  return infraReady;
}

/** Reserve and return the next order number, e.g. "mpl0001". */
export async function nextOrderNumber(orderId?: string): Promise<string> {
  await ensureOrderInfra();
  const pool = getPanelPool();
  const [res] = await pool.query<ResultSetHeader>(
    "INSERT INTO `order_sequence` (order_id, created_at) VALUES (?, ?)",
    [orderId ?? null, new Date().toISOString()]
  );
  const seq = res.insertId || 1;
  return `${PREFIX}${String(seq).padStart(4, "0")}`;
}
