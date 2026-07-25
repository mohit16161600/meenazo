import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";
import { getSession } from "@/lib/panelAuth";
import { MODELS } from "@/lib/panelModels";
import { rowToApi } from "@/lib/panelMap";
import { canAccess } from "@/lib/panelRoles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dashboard aggregate. Every role may open the dashboard, but each SECTION is
 * additionally gated by the role's resource access — a role that gets 403 on
 * /api/panel/orders must not receive the same order rows (customer PII),
 * revenue or product data through this aggregate.
 */
export async function GET() {
  const denied = await requireAccess("dashboard");
  if (denied) return denied;
  const session = await getSession();
  const role = session?.role;

  const pool = getPanelPool();

  // Counts — only for resources this role can access.
  const counts: Record<string, number> = {};
  for (const model of Object.values(MODELS)) {
    if (!canAccess(role, model.name)) continue;
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM \`${model.table}\``
      );
      counts[model.name] = Number(rows[0]?.n ?? 0);
    } catch {
      counts[model.name] = 0;
    }
  }

  // Orders section (recent orders incl. customer PII, revenue, pending count).
  let recentOrders: Record<string, unknown>[] = [];
  let revenue = 0;
  let pendingOrders = 0;
  if (canAccess(role, "orders")) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM `orders` ORDER BY created_at DESC LIMIT 6"
      );
      recentOrders = rows.map((r) => rowToApi(MODELS.orders, r));
      const [rev] = await pool.query<RowDataPacket[]>(
        "SELECT COALESCE(SUM(total),0) AS revenue, SUM(status='pending') AS pending FROM `orders` WHERE status <> 'cancelled'"
      );
      revenue = Number(rev[0]?.revenue ?? 0);
      pendingOrders = Number(rev[0]?.pending ?? 0);
    } catch {
      /* orders table may be empty */
    }
  }

  // Products section (low stock).
  let lowStock: Record<string, unknown>[] = [];
  if (canAccess(role, "products")) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM `products` WHERE stock <= 10 ORDER BY stock ASC LIMIT 5"
      );
      lowStock = rows.map((r) => rowToApi(MODELS.products, r));
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({
    success: true,
    counts,
    revenue,
    pendingOrders,
    recentOrders,
    lowStock,
  });
}
