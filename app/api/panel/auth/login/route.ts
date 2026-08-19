import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import {
  passwordMatches,
  createSessionToken,
  PANEL_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/panelAuth";
import { hitLoginLimit, clearLoginLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required." },
      { status: 422 }
    );
  }

  // Throttle before touching the DB — the admin panel is the highest-value
  // target on the site and was previously open to unlimited password guessing.
  const throttleIp = clientIp(req);
  // Throttled per ACCOUNT as well as per (ip, account): the ip comes from a
  // client-supplied header, so an ip-keyed bucket alone can be reset at will.
  const gate = hitLoginLimit("panel-login", throttleIp, email);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many failed attempts. Please try again in ${Math.ceil(gate.retryAfterSec / 60)} minute(s).`,
      },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  try {
    const pool = getPanelPool();
    // SELECT * so this keeps working whether or not the `password` column exists
    // yet (added by the schema migration on the next /panel/setup run).
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM `admin_users` WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (
      !user ||
      !passwordMatches(password, { password: user.password, passwordHash: user.password_hash })
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }
    if (!Number(user.active)) {
      return NextResponse.json(
        { success: false, message: "This account is disabled." },
        { status: 403 }
      );
    }

    // Correct credentials — don't let an earlier typo count against them.
    clearLoginLimit("panel-login", throttleIp, email);

    await pool.query("UPDATE `admin_users` SET last_login = ? WHERE id = ?", [
      new Date().toISOString(),
      user.id,
    ]);

    const token = createSessionToken({
      uid: String(user.id),
      email: String(user.email),
      name: String(user.name),
      role: String(user.role),
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(PANEL_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_DB_ERROR") {
      return NextResponse.json(
        {
          success: false,
          // "Run setup first" on its own is a dead end: /panel/setup 404s for
          // anyone who isn't a signed-in admin, and on a fresh install there is
          // no admin to sign in as. The only way in is the setup token, so say
          // so here rather than leaving the operator with no next step.
          message:
            "Panel is not installed yet. Set PANEL_SETUP_TOKEN in the server environment, restart, then POST /api/panel/setup with an 'x-setup-token' header carrying that value. The installer is closed until you do — that is deliberate.",
          needsSetup: true,
        },
        { status: 400 }
      );
    }
    console.error("[panel login] error:", err);
    return NextResponse.json(
      { success: false, message: "Login failed. Is MySQL running?" },
      { status: 500 }
    );
  }
}
