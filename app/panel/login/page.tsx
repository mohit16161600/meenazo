"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, apiPost, type ApiError } from "@/app/panel/_lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet<{ installed: boolean }>("/setup")
      .then((r) => setNeedsSetup(!r.installed))
      .catch(() => setNeedsSetup(true));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiPost("/auth/login", { email, password });
      window.location.assign("/panel/dashboard");
    } catch (err) {
      const ae = err as ApiError & { message: string };
      setError(ae.message);
      if (/not installed/i.test(ae.message)) setNeedsSetup(true);
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#18231d] px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{ background: "radial-gradient(600px 300px at 50% 0%, #5b8c6e, transparent)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-light to-brand text-lg font-black text-[#18231d]">
            M
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">Meenazo Admin</h1>
          <p className="text-sm text-white/50">Sign in to manage your store</p>
        </div>

        {needsSetup && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-sm text-amber-200">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            <span>
              Database isn&apos;t set up yet.{" "}
              <Link href="/panel/setup" className="font-bold text-amber-100 underline">
                Run one-click setup →
              </Link>
            </span>
          </div>
        )}

        <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6 shadow-brand-lg">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <Icon name="alert" size={16} /> {error}
            </div>
          )}
          <label className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
          <input
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@meenazo.com"
            autoComplete="username"
            required
          />
          <label className="mb-1.5 mt-4 block text-sm font-semibold text-ink">Password</label>
          <input
            type="password"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
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
