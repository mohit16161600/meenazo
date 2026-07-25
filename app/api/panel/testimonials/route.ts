import { collectionHandlers } from "@/lib/panelCrud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = collectionHandlers("testimonials");
