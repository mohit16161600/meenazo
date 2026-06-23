"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return "Please enter your full name.";
    if (!EMAIL_RE.test(email.trim())) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    if (password !== confirm) return "Passwords do not match.";
    if (!agree) return "Please accept the Terms & Privacy Policy to continue.";
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
    const res = await register(name.trim(), email.trim(), password);
    setSubmitting(false);

    if (res.success) {
      toast.success("Account created", res.message);
      router.push("/account");
    } else {
      setError(res.message);
      toast.error("Couldn't create account", res.message);
    }
  }

  return (
    <div className="animate-slideUp">
      <span className="eyebrow">Join Meenazo</span>
      <h2 className="mt-1.5">Create your account</h2>
      <p className="text-muted mt-2">
        Start your wellness journey — track orders, save favourites and reorder in seconds.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="field"
            placeholder="Priya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

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
          <label htmlFor="password" className="label">
            Password
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
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            className="field"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 mt-0.5 rounded border-line text-brand accent-brand"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-brand hover:text-brand-dark transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-semibold text-brand hover:text-brand-dark transition-colors">
              Privacy Policy
            </Link>
            .
          </span>
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
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
