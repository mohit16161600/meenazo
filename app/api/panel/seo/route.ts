import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/panelCrud";
import { getGlobalSeo, saveGlobalSeo } from "@/lib/panelSeo";
import type { GlobalSeo } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Global SEO settings. Gated on the "seo" resource rather than "settings" so
 * the SEO team can own site-wide metadata and verification codes without also
 * getting pricing, shipping and payment configuration.
 */

export async function GET() {
  const denied = await requireAccess("seo");
  if (denied) return denied;
  return NextResponse.json({ success: true, seo: await getGlobalSeo() });
}

export async function PUT(req: Request) {
  const denied = await requireAccess("seo");
  if (denied) return denied;

  let body: Partial<GlobalSeo>;
  try {
    body = (await req.json()) as Partial<GlobalSeo>;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  try {
    // Merge on top of what is stored so a partial save never blanks a field the
    // form didn't render.
    const current = await getGlobalSeo();
    const next = { ...current, ...body };
    await saveGlobalSeo(next);
    return NextResponse.json({ success: true, seo: next });
  } catch (err) {
    console.error("[panel seo] save failed:", err);
    return NextResponse.json(
      { success: false, message: "Could not save SEO settings." },
      { status: 500 }
    );
  }
}
