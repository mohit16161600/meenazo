import { NextResponse } from "next/server";
import { listRows, insertRow, requireAccess } from "@/lib/panelCrud";
import { MODELS } from "@/lib/panelModels";
import { hashPassword } from "@/lib/panelAuth";
import { DEFAULT_ROLE, isValidRole } from "@/lib/panelRoles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAccess("users");
  if (denied) return denied;
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const result = await listRows(MODELS.users, { q });
  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: Request) {
  const denied = await requireAccess("users");
  if (denied) return denied;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const password = String(body.password ?? "");
  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 6 characters." },
      { status: 422 }
    );
  }
  if (!body.email || !body.name) {
    return NextResponse.json(
      { success: false, message: "Name and email are required." },
      { status: 422 }
    );
  }
  if (body.role != null && body.role !== "" && !isValidRole(body.role)) {
    return NextResponse.json(
      { success: false, message: "Unknown role. Pick one of the listed roles." },
      { status: 422 }
    );
  }

  try {
    const created = await insertRow(MODELS.users, {
      name: body.name,
      email: String(body.email).toLowerCase(),
      // Stored plaintext (viewable in the panel/DB) per owner request, plus a
      // scrypt hash so login still works if the plaintext column is ever cleared.
      password,
      passwordHash: hashPassword(password),
      role: body.role || DEFAULT_ROLE,
      active: body.active ?? true,
    });
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err) {
    const e = err as { code?: string; sqlMessage?: string };
    const msg =
      e.code === "ER_DUP_ENTRY"
        ? "A user with that email already exists."
        : e.sqlMessage || "Could not create user.";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
