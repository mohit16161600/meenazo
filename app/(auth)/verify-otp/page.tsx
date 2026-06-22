"use client";

import {
  Suspense,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { useToast } from "@/context/ToastContext";

const OTP_LENGTH = 6;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const toast = useToast();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  function focusBox(i: number) {
    inputsRef.current[i]?.focus();
  }

  function handleChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char && index < OTP_LENGTH - 1) focusBox(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusBox(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusBox(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Missing email — please restart the recovery process.");
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError(null);

    setSubmitting(true);
    const res = await authService.verifyOtp(email, code);
    setSubmitting(false);

    if (res.success) {
      toast.success("Verified", res.message);
      router.push("/reset-password?email=" + encodeURIComponent(email));
    } else {
      setError(res.message);
      toast.error("Verification failed", res.message);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Missing email — please restart the recovery process.");
      return;
    }
    setResending(true);
    const res = await authService.forgotPassword(email);
    setResending(false);

    if (res.success) {
      toast.success("Code resent", res.message);
      if (res.otp) toast.info("Demo OTP", `Use this code to verify: ${res.otp}`);
      setDigits(Array(OTP_LENGTH).fill(""));
      focusBox(0);
    } else {
      toast.error("Couldn't resend code", res.message);
    }
  }

  return (
    <div className="animate-slideUp">
      <span className="eyebrow">Verify it&apos;s you</span>
      <h2 className="mt-1.5">Enter verification code</h2>
      <p className="text-muted mt-2">
        We sent a 6-digit code{email ? <> to <span className="font-semibold text-ink">{email}</span></> : ""}.
        Enter it below to continue.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <span className="label" id="otp-label">
            6-digit code
          </span>
          <div className="flex gap-2 sm:gap-3" role="group" aria-labelledby="otp-label">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                className="field !px-0 text-center text-xl font-bold flex-1 min-w-0"
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={submitting}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
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
          {submitting ? "Verifying…" : "Verify code"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-semibold text-brand hover:text-brand-dark transition-colors disabled:opacity-60"
        >
          {resending ? "Resending…" : "Resend OTP"}
        </button>
      </p>

      <p className="mt-3 text-sm text-muted text-center">
        <Link href="/forgot-password" className="font-semibold text-brand hover:text-brand-dark transition-colors">
          Use a different email
        </Link>
      </p>
    </div>
  );
}

function VerifyOtpFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-7 w-2/3 rounded-lg" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-full" />
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpFallback />}>
      <VerifyOtpForm />
    </Suspense>
  );
}
