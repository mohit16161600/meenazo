"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setSubmitting(true);
    const res = await login(email.trim(), password);
    setSubmitting(false);

    if (res.success) {
      toast.success("Welcome back!", res.message);
      router.push(redirect);
    } else {
      setError(res.message);
      toast.error("Sign in failed", res.message);
    }
  }

  return (
    <div className="animate-slideUp">
      <span className="eyebrow">Welcome back</span>
      <h2 className="mt-1.5">Sign in to your account</h2>
      <p className="text-muted mt-2">
        Access your orders, saved addresses and wellness wishlist.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="label mb-0">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              className="field pr-16"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-3 my-auto h-fit text-sm font-semibold text-muted hover:text-brand transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-brand accent-brand"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me on this device
        </label>

        {error && (
          <p
            role="alert"
            className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5"
          >
            {error}
          </p>
        )}

        <Button type="submit" block size="lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        New to Meenazo?{" "}
        <Link href="/register" className="font-semibold text-brand hover:text-brand-dark transition-colors">
          Create an account
        </Link>
      </p>

      <p className="mt-4 text-xs text-muted text-center bg-mint rounded-xl px-4 py-3 leading-relaxed">
        New here? Create an account — your data is stored locally in this browser for the demo.
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-7 w-2/3 rounded-lg" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
