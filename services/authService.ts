"use client";

import type { AuthResult, User } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";

/**
 * Dummy auth backed by localStorage. Every method returns an API-shaped
 * AuthResult so swapping to real Laravel endpoints later is a drop-in change.
 */

interface StoredUser extends User {
  password: string;
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) ?? "[]");
  } catch {
    return [];
  }
}
function writeUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}
function strip(u: StoredUser): User {
  const { password, ...rest } = u;
  void password;
  return rest;
}
function genId() {
  return "u-" + Math.random().toString(36).slice(2, 10);
}
function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function fakeToken(userId: string) {
  return btoa(`${userId}:${new Date().toISOString()}`);
}

async function wait<T>(value: T, ms = 500): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

/** OTPs are valid for 10 minutes after being issued. */
const OTP_TTL_MS = 10 * 60 * 1000;

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return wait({ success: false, message: "An account with this email already exists." });
    }
    const user: StoredUser = {
      id: genId(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeUsers(users);
    const token = fakeToken(user.id);
    persistSession(strip(user), token);
    return wait({ success: true, message: "Account created successfully!", user: strip(user), token });
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const users = readUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found || found.password !== password) {
      return wait({ success: false, message: "Invalid email or password." });
    }
    const token = fakeToken(found.id);
    persistSession(strip(found), token);
    return wait({ success: true, message: "Welcome back!", user: strip(found), token });
  },

  async forgotPassword(email: string): Promise<AuthResult> {
    const users = readUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      return wait({ success: false, message: "No account found with that email." });
    }
    const otp = genOtp();
    localStorage.setItem(STORAGE_KEYS.otp, JSON.stringify({ email, otp, ts: Date.now() }));
    return wait({ success: true, message: `OTP sent to ${email}.`, otp });
  },

  async verifyOtp(email: string, otp: string): Promise<AuthResult> {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.otp) ?? "{}");
      const fresh = typeof raw.ts === "number" && Date.now() - raw.ts <= OTP_TTL_MS;
      if (raw.email === email && raw.otp === otp && fresh) {
        return wait({ success: true, message: "OTP verified." });
      }
    } catch {
      /* ignore */
    }
    return wait({ success: false, message: "Invalid or expired OTP." });
  },

  async resetPassword(email: string, newPassword: string): Promise<AuthResult> {
    const users = readUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return wait({ success: false, message: "Account not found." });
    users[idx].password = newPassword;
    writeUsers(users);
    localStorage.removeItem(STORAGE_KEYS.otp);
    return wait({ success: true, message: "Password reset successfully. Please log in." });
  },

  async changePassword(email: string, current: string, next: string): Promise<AuthResult> {
    const users = readUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1 || users[idx].password !== current) {
      return wait({ success: false, message: "Current password is incorrect." });
    }
    users[idx].password = next;
    writeUsers(users);
    return wait({ success: true, message: "Password updated successfully." });
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResult> {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return wait({ success: false, message: "Account not found." });
    users[idx] = { ...users[idx], ...updates };
    writeUsers(users);
    const updated = strip(users[idx]);
    const session = getSession();
    if (session) persistSession(updated, session.token);
    return wait({ success: true, message: "Profile updated.", user: updated });
  },

  logout() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.authToken);
  },
};

/* ----------------------------- session helpers ----------------------------- */
function persistSession(user: User, token: string) {
  const payload = JSON.stringify({ user, token });
  // Persist in both — localStorage keeps the user signed in across sessions.
  localStorage.setItem(STORAGE_KEYS.auth, payload);
  sessionStorage.setItem(STORAGE_KEYS.auth, payload);
  localStorage.setItem(STORAGE_KEYS.authToken, token);
}

export function getSession(): { user: User; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.auth) ?? sessionStorage.getItem(STORAGE_KEYS.auth);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
