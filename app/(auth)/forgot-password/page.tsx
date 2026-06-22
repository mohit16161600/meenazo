"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { useToast } from "@/context/ToastContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);

    const target = email.trim();
    setSubmitting(true);
    const res = await authService.forgotPassword(target);
    setSubmitting(false);

    if (res.success) {
      toast.success("OTP sent", res.message);
      if (res.otp) {
        toast.info("Demo OTP", `Use this code to verify: ${res.otp}`);
      }
      router.push("/verify-otp?email=" + encodeURIComponent(target));
    } else {
      setError(res.message);
      toast.error("Couldn't send OTP", res.message);
    }
  }

  return (
    <div className="animate-slideUp">
      <span className="eyebrow">Account recovery</span>
      <h2 className="mt-1.5">Forgot your password?</h2>
      <p className="text-muted mt-2">
        Enter the email linked to your account and we&apos;ll send you a one-time verification code.
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

        {error && (
          <p
            role="alert"
            className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5"
          >
            {error}
          </p>
        )}

        <Button type="submit" block size="lg" disabled={submitting}>
          {submitting ? "Sending code…" : "Send verification code"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
