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
  const { requestOtp, verifyOtp } = useAuth();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP flow (email login is disabled for now — WhatsApp OTP only).
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const done = (msg: string) => {
    toast.success("Welcome!", msg);
    router.push(redirect);
  };

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setSubmitting(true);
    const res = await requestOtp(phone);
    setSubmitting(false);
    if (res.success) {
      setOtpSent(true);
      setDevCode(res.devCode ?? null);
      toast.success("OTP sent", res.message);
    } else {
      setError(res.message);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 4) {
      setError("Enter the OTP sent to your phone.");
      return;
    }
    setSubmitting(true);
    const res = await verifyOtp(phone, code.trim(), name.trim() || undefined);
    setSubmitting(false);
    if (res.success) done(res.message || "Signed in.");
    else setError(res.message);
  }

  return (
    <div className="animate-slideUp">
      <span className="eyebrow">Welcome</span>
      <h2 className="mt-1.5">Sign in to your account</h2>
      <p className="text-muted mt-2">Access your orders, wishlist and saved details.</p>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {!otpSent ? (
          <form onSubmit={sendOtp} className="mt-5 space-y-5" noValidate>
            <div>
              <label htmlFor="phone" className="label">Mobile number</label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                className="field"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={submitting}
              />
            </div>
            <Button type="submit" block size="lg" disabled={submitting}>
              {submitting ? "Sending OTP…" : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 space-y-5" noValidate>
            <div>
              <label htmlFor="code" className="label">Enter OTP sent to {phone}</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="field tracking-[0.4em] text-center text-lg"
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={submitting}
                autoFocus
              />
              {devCode && (
                <p className="mt-1.5 text-xs text-muted">
                  Dev mode — your OTP is <span className="font-mono font-bold text-brand">{devCode}</span>
                </p>
              )}
            </div>
            <div>
              <label htmlFor="name" className="label">Your name <span className="font-normal text-muted">(new customers)</span></label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="field"
                placeholder="e.g. Customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="submit" block size="lg" disabled={submitting}>
              {submitting ? "Verifying…" : "Verify & continue"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setCode("");
                setDevCode(null);
              }}
              className="w-full text-center text-sm font-semibold text-muted hover:text-brand"
            >
              ← Change number
            </button>
          </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        New to Meenazo?{" "}
        <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">Create an account</Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-7 w-2/3 rounded-lg" />
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
