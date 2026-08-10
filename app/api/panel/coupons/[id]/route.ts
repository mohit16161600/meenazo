import { itemHandlers } from "@/lib/panelCrud";
import { ensureOrderInfra } from "@/lib/orderNumber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = itemHandlers("coupons");

type ItemCtx = { params: Promise<{ id: string }> };

/** See the collection route: adds `coupons.applies_to` on an older install. */
async function ensureSchema(): Promise<void> {
  await ensureOrderInfra().catch(() => {});
}

export async function GET(req: Request, ctx: ItemCtx) {
  await ensureSchema();
  return handlers.GET(req, ctx);
}

export async function PUT(req: Request, ctx: ItemCtx) {
  await ensureSchema();
  return handlers.PUT(req, ctx);
}

export const DELETE = handlers.DELETE;
