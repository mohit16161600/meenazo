"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { useToast } from "@/context/ToastContext";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!email) return "Missing email — please restart the recovery process.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);

    setSubmitting(true);
    const res = await authService.resetPassword(email, password);
    setSubmitting(false);

    if (res.success) {
      toast.success("Password reset", res.message);
      router.push("/login");
    } else {
      setError(res.message);
      toast.error("Couldn't reset password", res.message);
    }
  }

  return (
    <div className="animate-slideUp">
      <span className="eyebrow">Almost there</span>
      <h2 className="mt-1.5">Set a new password</h2>
      <p className="text-muted mt-2">
        Choose a strong new password{email ? <> for <span className="font-semibold text-ink">{email}</span></> : ""}.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="password" className="label">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              className="field pr-16"
              placeholder="At least 6 characters"
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

        <div>
          <label htmlFor="confirm" className="label">
            Confirm new password
          </label>
          <input
            id="confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            className="field"
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {submitting ? "Saving…" : "Reset password"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-7 w-2/3 rounded-lg" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-full" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
