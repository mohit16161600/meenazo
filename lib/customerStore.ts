import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";

/**
 * Customer data access — PHONE is the primary key. Shared by the OTP/email auth
 * routes, the order routes and the panel customer-360 view.
 */

export interface CustomerRow extends RowDataPacket {
  phone: string;
  name: string | null;
  email: string | null;
  password: string | null;
  verified: number;
  last_login_at: string | null;
  ip: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** The customer shape returned to the browser (never the password). */
export interface PublicCustomer {
  phone: string;
  name: string;
  email: string | null;
  verified: boolean;
  createdAt: string | null;
}

export function toPublicCustomer(row: CustomerRow): PublicCustomer {
  return {
    phone: String(row.phone),
    name: String(row.name ?? ""),
    email: row.email ? String(row.email) : null,
    verified: Boolean(Number(row.verified)),
    createdAt: row.created_at ?? null,
  };
}

export async function getCustomerByPhone(phone: string): Promise<CustomerRow | null> {
  const pool = getPanelPool();
  const [rows] = await pool.query<CustomerRow[]>(
    "SELECT * FROM `customers` WHERE phone = ? LIMIT 1",
    [phone]
  );
  return rows[0] ?? null;
}

export async function getCustomerByEmail(email: string): Promise<CustomerRow | null> {
  const pool = getPanelPool();
  const [rows] = await pool.query<CustomerRow[]>(
    "SELECT * FROM `customers` WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  return rows[0] ?? null;
}

/** Create-or-refresh a customer after a successful OTP (marks verified). */
export async function upsertCustomerOnOtp(
  phone: string,
  name: string | undefined,
  ip: string | undefined
): Promise<void> {
  const pool = getPanelPool();
  const now = new Date().toISOString();
  await pool.query(
    "INSERT INTO `customers` (phone, name, verified, last_login_at, ip, created_at, updated_at) " +
      "VALUES (?, ?, 1, ?, ?, ?, ?) " +
      "ON DUPLICATE KEY UPDATE name = COALESCE(VALUES(name), name), verified = 1, last_login_at = VALUES(last_login_at), updated_at = VALUES(updated_at)",
    [phone, name?.trim() || null, now, ip ?? null, now, now]
  );
}

/** Register a customer with an email+password (phone still primary). */
export async function createCustomer(input: {
  phone: string;
  name: string;
  email?: string | null;
  password?: string | null;
  ip?: string | null;
}): Promise<void> {
  const pool = getPanelPool();
  const now = new Date().toISOString();
  await pool.query(
    "INSERT INTO `customers` (phone, name, email, password, verified, ip, created_at, updated_at) " +
      "VALUES (?, ?, ?, ?, 0, ?, ?, ?)",
    [
      input.phone,
      input.name.trim(),
      input.email?.trim().toLowerCase() || null,
      input.password || null,
      input.ip ?? null,
      now,
      now,
    ]
  );
}

/** Mark a customer's live cart as converted once an order is placed/paid. */
export async function markCartConverted(phone: string): Promise<void> {
  const pool = getPanelPool();
  await pool.query("UPDATE `carts` SET status = 'converted', updated_at = ? WHERE phone = ?", [
    new Date().toISOString(),
    phone,
  ]);
  // They came back and ordered, so anything logged as abandoned for this
  // number is now recovered. Done HERE because every order path already calls
  // this one function — and a bookkeeping slip must never fail an order.
  try {
    const { markAbandonedRecovered } = await import("./abandonedCarts");
    await markAbandonedRecovered(phone);
  } catch (err) {
    console.error("[abandoned] recovery mark failed:", (err as Error)?.message);
  }
}

/** Touch last_login_at (email login path). */
export async function touchCustomerLogin(phone: string): Promise<void> {
  const pool = getPanelPool();
  await pool.query("UPDATE `customers` SET last_login_at = ? WHERE phone = ?", [
    new Date().toISOString(),
    phone,
  ]);
}

/** Update editable profile fields (name/email/password) for a phone. */
export async function updateCustomer(
  phone: string,
  fields: { name?: string; email?: string | null; password?: string | null }
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.name !== undefined) {
    sets.push("name = ?");
    values.push(fields.name.trim());
  }
  if (fields.email !== undefined) {
    sets.push("email = ?");
    values.push(fields.email ? fields.email.trim().toLowerCase() : null);
  }
  if (fields.password !== undefined) {
    sets.push("password = ?");
    values.push(fields.password || null);
  }
  if (!sets.length) return;
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(phone);
  const pool = getPanelPool();
  await pool.query(`UPDATE \`customers\` SET ${sets.join(", ")} WHERE phone = ?`, values);
}
