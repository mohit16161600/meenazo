import { itemHandlers } from "@/lib/panelCrud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, PUT, DELETE } = itemHandlers("orders");
