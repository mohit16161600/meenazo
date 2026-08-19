import { NextResponse } from "next/server";
import { requireVerifiedCustomer } from "@/lib/customerAuth";
import {
  getCustomerByPhone,
  getCustomerByEmail,
  updateCustomer,
  toPublicCustomer,
} from "@/lib/customerStore";
import { logCustomerActivity } from "@/lib/customerActivity";
import { clientIp } from "@/lib/clientIp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  // Verified only. An unverified (register-only) session planting an email and
  // password here is the takeover step: the credentials outlive the real
  // owner's later OTP login, because that only refreshes name/verified.
  const gate = await requireVerifiedCustomer();
  if (!gate.ok) {
    const { ok, status, ...rest } = gate;
    void ok;
    return NextResponse.json({ success: false, ...rest }, { status });
  }

  const phone = gate.phone;
  const body = await req.json().catch(() => null);

  const row = await getCustomerByPhone(phone);
  if (!row) return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 });

  const fields: { name?: string; email?: string | null; password?: string | null } = {};

  if (body?.name !== undefined) fields.name = String(body.name).trim();

  if (body?.email !== undefined) {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (email) {
      const other = await getCustomerByEmail(email);
      if (other && String(other.phone) !== phone) {
        return NextResponse.json({ success: false, message: "That email is already in use." }, { status: 409 });
      }
    }
    fields.email = email || null;
  }

  if (body?.password !== undefined && String(body.password) !== "") {
    const next = String(body.password);
    if (next.length < 6) {
      return NextResponse.json({ success: false, message: "Password must be at least 6 characters." }, { status: 422 });
    }
    // If a password already exists, require the current one.
    if (row.password && String(row.password).length > 0) {
      if (String(body?.currentPassword ?? "") !== String(row.password)) {
        return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 401 });
      }
    }
    fields.password = next;
  }

  try {
    await updateCustomer(phone, fields);
    // Which fields changed, never the values (passwords must not sit in the log).
    await logCustomerActivity(phone, "profile_update", { fields: Object.keys(fields) }, clientIp(req));
    const updated = await getCustomerByPhone(phone);
    return NextResponse.json({
      success: true,
      message: "Profile updated.",
      customer: updated ? toPublicCustomer(updated) : null,
    });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, message: "That email is already in use." }, { status: 409 });
    }
    console.error("[customer/profile] error:", err);
    return NextResponse.json({ success: false, message: "Could not update profile." }, { status: 500 });
  }
}
