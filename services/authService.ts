"use client";

import type { AuthResult, User } from "@/types";

/**
 * Real, DB-backed customer auth over same-origin API routes.
 * PHONE is the primary identity; email/password is an optional secondary login.
 * The session lives in an httpOnly cookie (set by the server), so there is no
 * token to juggle client-side — call `me()` to learn who is signed in.
 */

interface CustomerDto {
  phone: string;
  name: string;
  email: string | null;
  verified?: boolean;
  createdAt?: string | null;
}

function toUser(c: CustomerDto | undefined | null): User | undefined {
  if (!c) return undefined;
  return {
    id: String(c.phone),
    name: String(c.name ?? ""),
    email: String(c.email ?? ""),
    phone: String(c.phone),
    verified: Boolean(c.verified),
    createdAt: String(c.createdAt ?? ""),
  };
}

async function req(
  path: string,
  method: "GET" | "POST" | "PUT" = "POST",
  body?: unknown
): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return { success: res.ok, message: res.ok ? "" : `Request failed (${res.status})` };
  }
}

export const authService = {
  /** Send a login OTP to a mobile number (SMS + WhatsApp when configured). */
  async requestOtp(phone: string): Promise<AuthResult> {
    const d = await req("/api/auth/otp/send", "POST", { phone });
    return {
      success: Boolean(d.success),
      message: String(d.message ?? ""),
      devCode: d.devCode ? String(d.devCode) : undefined,
      channels: d.channels ? String(d.channels) : undefined,
    };
  },

  /** Verify a phone OTP → creates/returns the customer and signs them in. */
  async verifyOtp(phone: string, code: string, name?: string): Promise<AuthResult> {
    const d = await req("/api/auth/otp/verify", "POST", { phone, code, name });
    return {
      success: Boolean(d.success),
      message: String(d.message ?? ""),
      user: toUser(d.customer as CustomerDto),
    };
  },

  /** Optional secondary login with email + password. */
  async loginEmail(email: string, password: string): Promise<AuthResult> {
    const d = await req("/api/auth/login", "POST", { email, password });
    return {
      success: Boolean(d.success),
      message: String(d.message ?? ""),
      user: toUser(d.customer as CustomerDto),
    };
  },

  /** Register with mobile (primary) + optional email/password. */
  async register(input: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
  }): Promise<AuthResult> {
    const d = await req("/api/auth/register", "POST", input);
    return {
      success: Boolean(d.success),
      message: String(d.message ?? ""),
      user: toUser(d.customer as CustomerDto),
    };
  },

  /** Who is signed in (or null). */
  async me(): Promise<User | null> {
    const d = await req("/api/auth/me", "GET");
    return toUser(d.customer as CustomerDto) ?? null;
  },

  async logout(): Promise<void> {
    await req("/api/auth/logout", "POST");
  },

  /** Update the signed-in customer's profile (name / email / password). */
  async updateProfile(fields: {
    name?: string;
    email?: string;
    password?: string;
    currentPassword?: string;
  }): Promise<AuthResult> {
    const d = await req("/api/customer/profile", "PUT", fields);
    return {
      success: Boolean(d.success),
      message: String(d.message ?? ""),
      user: toUser(d.customer as CustomerDto),
    };
  },

  /** Change password (session-based; email arg kept for call-site compatibility). */
  async changePassword(_email: string, current: string, next: string): Promise<AuthResult> {
    return authService.updateProfile({ password: next, currentPassword: current });
  },

  /* --- legacy email-recovery flow: customers now sign in with mobile OTP --- */
  async forgotPassword(_email: string): Promise<AuthResult> {
    return {
      success: false,
      message: "Password reset by email isn't needed — just log in with your mobile number & OTP.",
    };
  },
  async resetPassword(_email: string, _newPassword: string): Promise<AuthResult> {
    return {
      success: false,
      message: "Please log in with your mobile number & OTP instead.",
    };
  },
};
