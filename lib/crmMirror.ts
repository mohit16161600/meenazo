import { getCrmPool } from "@/lib/db";

/**
 * Best-effort mirror of an order's line items into the live CRM `enquiry`
 * table (one row per product, no quantity — the CRM's own legacy format).
 * Shared by the COD route and the Razorpay verify route so both payment
 * methods create the same CRM leads.
 *
 * CRM `enquiry` columns (do NOT rename without checking the live table):
 *   en_lg_by, product_id, en_name, en_mobile, en_address, en_state,
 *   ip, source, source2
 *
 * If the CRM is unreachable (IP whitelist etc.) this returns {ok:false} and the
 * caller keeps the order — the local DB row is the source of truth.
 */

/** Slug -> CRM product id + source label (enforced server-side). */
export const CRM_PRODUCTS: Record<string, { id: number; source: string }> = {
  diasuddhi: { id: 13, source: "website diasuddhi" },
  joshveda: { id: 14, source: "website joshveda" },
  slimpax: { id: 15, source: "website slimpax" },
};

const EN_LG_BY = 1;

export interface CrmMirrorItem {
  product?: string; // product slug
}

export async function mirrorToCrm(
  items: CrmMirrorItem[],
  name: string,
  mobile: string,
  address: string,
  state: string,
  ip: string
): Promise<{ ok: boolean; inserted: number }> {
  const columns = [
    "en_lg_by",
    "product_id",
    "en_name",
    "en_mobile",
    "en_address",
    "en_state",
    "ip",
    "source",
    "source2",
  ];
  const rows: unknown[][] = [];
  for (const item of items) {
    const meta = CRM_PRODUCTS[(item.product ?? "").toLowerCase().trim()];
    if (!meta) continue;
    rows.push([EN_LG_BY, meta.id, name, mobile, address, state, ip, meta.source, meta.source]);
  }
  if (rows.length === 0) return { ok: false, inserted: 0 };

  const placeholders = `(${columns.map(() => "?").join(", ")})`;
  const sql =
    `INSERT INTO \`enquiry\` (${columns.join(", ")}) ` +
    `VALUES ${rows.map(() => placeholders).join(", ")}`;
  try {
    const pool = getCrmPool();
    const [result] = await pool.query(sql, rows.flat());
    const inserted = (result as { affectedRows?: number }).affectedRows ?? rows.length;
    return { ok: true, inserted };
  } catch (err) {
    console.error("[CRM] mirror failed (order still saved locally):", err);
    return { ok: false, inserted: 0 };
  }
}
