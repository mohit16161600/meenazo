import { NextResponse } from "next/server";
import { getSession } from "@/lib/panelAuth";
import { runPublish } from "@/lib/panelPublish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Copy the panel database out to the storefront's snapshot files.
 *
 * Admin-only. Publishing rewrites what every visitor sees across the whole
 * site at once, which is a different weight of action from editing one product
 * — and unlike an edit there is no per-record undo.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Not authorised." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Only an administrator can publish." },
      { status: 403 }
    );
  }

  try {
    const report = await runPublish();
    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("[panel publish] failed:", err);
    return NextResponse.json(
      { success: false, message: "Publish failed. Check the server logs." },
      { status: 500 }
    );
  }
}
