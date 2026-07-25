import { NextResponse } from "next/server";
import { getRow, updateRow, deleteRow, requireAccess } from "@/lib/panelCrud";
import { MODELS } from "@/lib/panelModels";
import { hashPassword, getSession } from "@/lib/panelAuth";
import { isValidRole } from "@/lib/panelRoles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function idOf(ctx: { params: Promise<{ id: string }> }) {
  return decodeURIComponent((await ctx.params).id);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess("users");
  if (denied) return denied;
  const row = await getRow(MODELS.users, await idOf(ctx));
  if (!row) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, item: row });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess("users");
  if (denied) return denied;
  const id = await idOf(ctx);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  if (body.role !== undefined && !isValidRole(body.role)) {
    return NextResponse.json(
      { success: false, message: "Unknown role. Pick one of the listed roles." },
      { status: 422 }
    );
  }

  const patch: Record<string, unknown> = {
    name: body.name,
    email: body.email ? String(body.email).toLowerCase() : undefined,
    role: body.role,
    active: body.active,
  };
  // Only change the password when a non-empty one is supplied.
  const password = String(body.password ?? "");
  if (password) {
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 422 }
      );
    }
    // Plaintext (viewable) + scrypt hash fallback — see users POST route.
    patch.password = password;
    patch.passwordHash = hashPassword(password);
  }
  // drop undefined keys so we don't null out columns
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

  try {
    const updated = await updateRow(MODELS.users, id, patch);
    if (!updated) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    const e = err as { code?: string };
    const msg = e.code === "ER_DUP_ENTRY" ? "That email is already in use." : "Update failed.";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess("users");
  if (denied) return denied;
  const id = await idOf(ctx);
  const session = await getSession();
  if (session && session.uid === id) {
    return NextResponse.json(
      { success: false, message: "You cannot delete your own account while logged in." },
      { status: 400 }
    );
  }
  const ok = await deleteRow(MODELS.users, id);
  return NextResponse.json({ success: ok });
}
