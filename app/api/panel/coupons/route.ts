import { collectionHandlers } from "@/lib/panelCrud";
import { ensureOrderInfra } from "@/lib/orderNumber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = collectionHandlers("coupons");

/**
 * `coupons.applies_to` (the prepaid/COD scope) was added after the table
 * shipped, so an existing install has a `coupons` table without it — saving a
 * coupon there would fail with "Unknown column". The cached schema migration
 * adds it on first use, so the panel heals itself instead of needing a setup
 * re-run. A migration failure must never block reading coupons, hence the
 * swallowed rejection.
 */
async function ensureSchema(): Promise<void> {
  await ensureOrderInfra().catch(() => {});
}

export async function GET(req: Request) {
  await ensureSchema();
  return handlers.GET(req);
}

export async function POST(req: Request) {
  await ensureSchema();
  return handlers.POST(req);
}
