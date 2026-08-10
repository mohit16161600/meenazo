import type { RowDataPacket } from "mysql2";
import { getPanelPool, PANEL_DB } from "./panelDb";
import { ensureSerialIds } from "./serialIds";

/**
 * Sequential human order numbers — MPL0001, MPL0002, MPL0003 …
 * ---------------------------------------------------------------------------
 * The number IS the order's serial id: `orders.id` is a plain AUTO_INCREMENT
 * S.No (1, 2, 3, … — atomic and race-free), and the MPL number is just that
 * serial formatted as `MPL` + 4-digit zero-padded (widens past 9999). The old
 * dedicated `order_sequence` table is retired (dropped by ensureSerialIds).
 * The prefix is ALWAYS uppercase (owner's requirement). Lookups stay
 * case-insensitive (utf8mb4_unicode_ci), so older lowercase mpl#### rows keep
 * resolving fine.
 *
 * `ensureOrderInfra()` is self-migrating: it converts legacy string ids to
 * serials and backfills the EasyEcom/dispatch columns onto already-installed
 * `orders` / `products` tables, so the new order pipeline works without a
 * manual setup re-run. It does the real work once per process (cached promise).
 */

const PREFIX = "MPL";

/** Format an order's serial id as its human/EasyEcom order number. */
export function formatOrderNumber(serial: number): string {
  return `${PREFIX}${String(serial).padStart(4, "0")}`;
}

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

/** Convert legacy ids to serials + backfill integration columns (idempotent, cached). */
export function ensureOrderInfra(): Promise<void> {
  if (infraReady) return infraReady;
  infraReady = (async () => {
    // Serial S.No ids on orders/otp_codes/faqs/customer_activity, and the
    // retired order_sequence table dropped.
    await ensureSerialIds();
    await addColumnIfMissing("products", "sku", "`sku` VARCHAR(64) NULL");
    // Default 1 so existing products stay published/sellable after the upgrade -
    // adding these as NULL would silently hide the whole catalogue.
    await addColumnIfMissing("products", "active", "`active` TINYINT(1) NOT NULL DEFAULT 1");
    await addColumnIfMissing("products", "in_stock", "`in_stock` TINYINT(1) NOT NULL DEFAULT 1");
    // Same reasoning as products: DEFAULT 1 so the existing categories stay
    // published after the upgrade instead of vanishing from the storefront.
    // Coupon payment scoping (prepaid/cod/both) — must exist before the next
    // order is priced, or a scoped coupon would silently read as "both".
    await addColumnIfMissing("coupons", "applies_to", "`applies_to` VARCHAR(16) NULL");
    await addColumnIfMissing("categories", "active", "`active` TINYINT(1) NOT NULL DEFAULT 1");
    await addColumnIfMissing("categories", "sort_order", "`sort_order` INT NULL");
    await addColumnIfMissing("categories", "seo_title", "`seo_title` VARCHAR(255) NULL");
    await addColumnIfMissing("categories", "seo_description", "`seo_description` TEXT NULL");
    await addColumnIfMissing("orders", "shipping_phone", "`shipping_phone` VARCHAR(32) NULL");
    await addColumnIfMissing("orders", "amount_paid", "`amount_paid` INT NULL");
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
    // WhatsApp order confirmation: the stamp doubles as the once-only lock, so
    // it must exist before any order is placed (see lib/orderNotify.ts).
    await addColumnIfMissing("orders", "whatsapp_sent_at", "`whatsapp_sent_at` VARCHAR(40) NULL");
    await addColumnIfMissing("orders", "whatsapp_log", "`whatsapp_log` LONGTEXT NULL");
    // Instant "pay online" discount, kept apart from the coupon discount so the
    // panel can report on the offer (see lib/pricing.ts).
    await addColumnIfMissing("orders", "prepaid_discount", "`prepaid_discount` INT NULL");
  })().catch((err) => {
    // Reset so a transient failure can be retried on the next order.
    infraReady = null;
    throw err;
  });
  return infraReady;
}
