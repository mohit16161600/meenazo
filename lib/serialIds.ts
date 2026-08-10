import type { RowDataPacket } from "mysql2";
import { getPanelPool, PANEL_DB } from "./panelDb";
import { MODELS } from "./panelModels";
import { ddlForModel } from "./panelMap";

/**
 * Serial-number primary keys (owner's requirement: "normal S.No se kaam chalao").
 * ---------------------------------------------------------------------------
 * `orders`, `otp_codes`, `faqs` and `customer_activity` use a plain
 * AUTO_INCREMENT id — 1, 2, 3, … in insertion order — instead of the old
 * generated string ids ("o-c8fbdd18…", "otp-121c…", "faq-1").
 *
 * This module is the idempotent migration for installs that predate the
 * change: it renumbers the existing rows in their original insertion order
 * (oldest = 1) and converts the column to BIGINT AUTO_INCREMENT, so old data
 * keeps its history and new rows simply continue the sequence. It also drops
 * the now-redundant `order_sequence` table — the orders serial itself IS the
 * sequence behind the MPL#### numbers now.
 *
 * Runs once per process (cached promise); wired into order capture, panel
 * setup, and every pkAuto insert, so no manual step is ever needed.
 */

/** Insertion order used to renumber LEGACY rows of each table. */
const RENUMBER_ORDER: Record<string, string> = {
  orders: "created_at ASC, id ASC",
  otp_codes: "created_at ASC, id ASC",
  // Seeded faqs were faq-1 … faq-N with sort_order 1 … N — keep that mapping.
  faqs: "sort_order ASC, created_at ASC, id ASC",
  customer_activity: "created_at ASC, id ASC",
};

async function idColumnInfo(
  table: string
): Promise<{ exists: boolean; isAuto: boolean }> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT EXTRA FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = 'id' LIMIT 1",
    [PANEL_DB.database, table]
  );
  if (!rows.length) return { exists: false, isAuto: false };
  return {
    exists: true,
    isAuto: String(rows[0].EXTRA ?? "").toLowerCase().includes("auto_increment"),
  };
}

/** Renumber legacy string ids to 1…N (insertion order) and make id AUTO_INCREMENT. */
async function migrateTable(table: string): Promise<void> {
  const info = await idColumnInfo(table);
  if (!info.exists || info.isAuto) return; // fresh DDL already correct, or done

  const pool = getPanelPool();
  const orderBy = RENUMBER_ORDER[table] ?? "created_at ASC, id ASC";
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM \`${table}\` ORDER BY ${orderBy}`
  );

  // Two passes so a legacy id that already looks numeric ("1") can never
  // collide with a serial we're assigning: first stamp unique temp ids, then
  // strip the marker.
  let n = 0;
  for (const row of rows) {
    n++;
    await pool.query(`UPDATE \`${table}\` SET id = ? WHERE id = ?`, [
      `mig~${n}`,
      row.id,
    ]);
  }
  await pool.query(
    `UPDATE \`${table}\` SET id = SUBSTRING(id, 5) WHERE id LIKE 'mig~%'`
  );

  await pool.query(
    `ALTER TABLE \`${table}\` MODIFY \`id\` BIGINT NOT NULL AUTO_INCREMENT`
  );
  console.log(`[serialIds] ${table}: renumbered ${n} row(s) to serial ids`);
}

/**
 * Point the orders counter at the right next serial.
 *
 * Order numbers derive from the serial id now, so the counter must sit past
 * both the highest row id AND the highest existing MPL#### (the old
 * order_sequence could run ahead of the row count) — otherwise a new order
 * could reuse a number an old order already carries.
 *
 * ONLY `MPL####` numbers count. The pre-2026-07 format was `MZ<epoch>`, so
 * stripping non-digits from those yields eight-digit timestamps and would
 * launch the counter into the tens of millions — every "S.No" from then on
 * would read MPL97840678. MySQL clamps any target below MAX(id)+1, so this can
 * never hand out a duplicate id.
 *
 * Trade-off of "the S.No IS the number" (what the owner asked for): deleting
 * the newest order frees its number for the next one. MariaDB already resets
 * AUTO_INCREMENT to MAX(id)+1 on restart, so only a persistent high-water table
 * — the `order_sequence` we just retired — could prevent that.
 */
const MPL_NUMBER = /^mpl0*(\d+)$/i;

async function alignOrderCounter(): Promise<void> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT MAX(id) AS maxId FROM `orders`"
  );
  const maxId = Number(rows[0]?.maxId ?? 0);

  const [nums] = await pool.query<RowDataPacket[]>(
    "SELECT order_number FROM `orders` WHERE order_number IS NOT NULL"
  );
  let maxMpl = 0;
  for (const r of nums) {
    const match = MPL_NUMBER.exec(String(r.order_number).trim());
    if (!match) continue; // legacy MZ<epoch> and anything else: not a serial
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > maxMpl) maxMpl = n;
  }

  const target = Math.max(maxId, maxMpl) + 1;
  const [cur] = await pool.query<RowDataPacket[]>(
    "SELECT AUTO_INCREMENT AS next FROM information_schema.tables WHERE table_schema = ? AND table_name = 'orders'",
    [PANEL_DB.database]
  );
  if (Number(cur[0]?.next ?? 0) === target) return;

  // AUTO_INCREMENT takes no placeholders; `target` is a computed integer.
  await pool.query(`ALTER TABLE \`orders\` AUTO_INCREMENT = ${target}`);
  console.log(`[serialIds] orders: next serial set to ${target}`);
}

let ready: Promise<void> | null = null;

/** Idempotent, cached: create/convert the serial-id tables, drop order_sequence. */
export function ensureSerialIds(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const pool = getPanelPool();

    // Make sure the pkAuto tables exist with the right DDL even before the
    // owner re-runs setup (e.g. customer_activity on a live install).
    for (const model of Object.values(MODELS)) {
      if (!model.pkAuto) continue;
      await pool.query(ddlForModel(model));
      await migrateTable(model.table);
    }

    await alignOrderCounter();

    // The dedicated sequence table is retired — the orders serial IS the sequence.
    await pool.query("DROP TABLE IF EXISTS `order_sequence`");
  })().catch((err) => {
    ready = null; // transient failure → retry on the next call
    throw err;
  });
  return ready;
}
