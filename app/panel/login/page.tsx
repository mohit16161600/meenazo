"use client";

import { useState } from "react";
import { Button } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiPost, type ApiError } from "@/app/panel/_lib/api";

/**
 * The login screen is the only public page in the panel, so it says as little
 * as possible: no install status, no database state, no link to the installer.
 * Anything an anonymous visitor can read here is something an attacker can read
 * too, and "the database isn't set up" is a useful thing for them to know.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiPost("/auth/login", { email, password });
      window.location.assign("/panel/dashboard");
    } catch (err) {
      const ae = err as ApiError & { message: string };
      // Say what to do next, never a bare status code, and never blame the
      // reader ("the email or password" - not "you entered the wrong...").
      const friendly =
        ae.status === 401
          ? "The email or password doesn't match. Check them and try again."
          : ae.status === 404 || ae.status === 503
            ? "The server isn't ready yet. Wait a moment, then try again."
            : "Something went wrong. Please try again in a moment.";
      setError(friendly);
      setBusy(false);
    }
  }

  const inputCls =
    "min-h-[44px] w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#18231d] px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{ background: "radial-gradient(600px 300px at 50% 0%, #5b8c6e, transparent)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand text-lg font-black text-[#18231d]">
            M
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">Meenazo Admin</h1>
          <p className="text-sm text-white/50">Sign in to manage your store</p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-line bg-white p-6 shadow-brand-lg">
          {/* role="alert" so a screen reader hears the failure immediately. */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              <Icon name="alert" size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}
          <label htmlFor="panel-email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="panel-email"
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@meenazo.com"
            autoComplete="username"
            required
          />
          <label htmlFor="panel-password" className="mb-1.5 mt-6 block text-sm font-semibold text-ink">
            Password
          </label>
          <div className="relative">
            <input
              id="panel-password"
              type={showPassword ? "text" : "password"}
              className={`${inputCls} pr-20`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            {/* A show/hide toggle is standard on password fields - typing blind
                is the commonest cause of a failed sign-in. */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <Button type="submit" loading={busy} className="mt-6 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-white/40">
          Meenazo · Ayurvedic wellness admin
        </p>
      </div>
    </div>
  );
}
