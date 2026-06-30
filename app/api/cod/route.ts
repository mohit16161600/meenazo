import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { getCrmPool } from "@/lib/db";

/**
 * COD order endpoint — runs on the same Node server as the site, so there is
 * NO CORS / loopback / PHP needed. Inserts one row per product into the CRM
 * `enquiry` table.
 *
 * This is a faithful port of the original PHP cod.php. The CRM `enquiry` table
 * uses these columns (do NOT rename without checking the live table):
 *   en_lg_by, product_id, en_name, en_mobile, en_address, en_state,
 *   ip, source, source2
 *
 * NOTE: The CRM stores one row per product line and does NOT store quantity —
 * mirror that here so the data matches existing leads.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Slug -> CRM product id + source label (enforced server-side). */
const PRODUCTS: Record<string, { id: number; source: string }> = {
  diasuddhi: { id: 13, source: "website diasuddhi" },
  joshveda: { id: 14, source: "website joshveda" },
  slimpax: { id: 15, source: "website slimpax" },
};

const EN_LG_BY = 1;

interface CodItem {
  product?: string;
  quantity?: number;
}
interface CodBody {
  name?: string;
  mobile?: string;
  address?: string;
  state?: string;
  items?: CodItem[];
  product?: string; // single-product shorthand
}

/**
 * Best-effort client IP from common proxy headers, validated like PHP's
 * FILTER_VALIDATE_IP so a spoofed/garbage header can't pollute the CRM.
 * Requires nginx to set X-Real-IP / X-Forwarded-For (see deploy notes);
 * otherwise falls back to "0.0.0.0".
 */
function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    xff ? xff.split(",")[0]?.trim() : null,
    req.headers.get("x-real-ip"),
  ];
  for (const c of candidates) {
    if (c && isIP(c) !== 0) return c;
  }
  return "0.0.0.0";
}

export async function POST(req: Request) {
  let body: CodBody;
  try {
    body = (await req.json()) as CodBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = String(body.name ?? "").trim();
  const mobile = String(body.mobile ?? "").trim().replace(/[^0-9+]/g, "");
  const address = String(body.address ?? "").trim();
  const state = String(body.state ?? "").trim();
  let items = Array.isArray(body.items) ? body.items : [];

  // Allow single-product shorthand: { "product": "slimpax" }
  if (items.length === 0 && body.product) {
    items = [{ product: body.product, quantity: 1 }];
  }

  // ---- Validate (mirrors cod.php) ----
  const errors: string[] = [];
  if (name === "") errors.push("name is required");
  if (mobile.length < 10) errors.push("valid mobile is required");
  if (address === "") errors.push("address is required");
  if (state === "") errors.push("state is required");
  if (items.length === 0) errors.push("at least one product is required");
  if (errors.length) {
    return NextResponse.json(
      { success: false, message: errors.join(", ") },
      { status: 422 }
    );
  }

  const ip = clientIp(req);

  // ---- Build one row per known product ----
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
  const skipped: string[] = [];

  for (const item of items) {
    const slug = (item.product ?? "").toLowerCase().trim();
    const meta = PRODUCTS[slug];
    if (!meta) {
      skipped.push(slug);
      continue;
    }
    rows.push([
      EN_LG_BY,
      meta.id,
      name,
      mobile,
      address,
      state,
      ip,
      meta.source,
      meta.source,
    ]);
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "No valid products to record", skipped },
      { status: 422 }
    );
  }

  const placeholders = `(${columns.map(() => "?").join(", ")})`;
  const sql =
    `INSERT INTO \`enquiry\` (${columns.join(", ")}) ` +
    `VALUES ${rows.map(() => placeholders).join(", ")}`;
  const values = rows.flat();

  try {
    const pool = getCrmPool();
    const [result] = await pool.query(sql, values);
    const inserted = (result as { affectedRows?: number }).affectedRows ?? rows.length;
    return NextResponse.json({
      success: true,
      message: "COD order recorded",
      inserted,
      ip,
    });
  } catch (err) {
    console.error("[COD] DB insert failed:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Could not record the order. Please try again.",
      },
      { status: 500 }
    );
  }
}
