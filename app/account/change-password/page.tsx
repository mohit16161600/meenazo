"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authService } from "@/services/authService";

const MIN_LENGTH = 6;

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      error("Not signed in", "Please sign in again to change your password.");
      return;
    }
    if (!current || !next || !confirm) {
      error("Missing fields", "Please fill in all password fields.");
      return;
    }
    if (next.length < MIN_LENGTH) {
      error("Password too short", `Your new password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      error("Passwords don't match", "The new password and confirmation must be identical.");
      return;
    }
    if (next === current) {
      error("Choose a new password", "Your new password must be different from the current one.");
      return;
    }

    setSaving(true);
    const res = await authService.changePassword(user.email, current, next);
    setSaving(false);

    if (res.success) {
      success("Password updated", res.message);
      reset();
    } else {
      error("Update failed", res.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-ink">Change Password</h2>

      <form onSubmit={handleSubmit} className="card-surface p-6 max-w-xl">
        <p className="text-sm text-muted mb-5">
          For your security, choose a strong password you don&apos;t use anywhere else.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="cp-current">
              Current password
            </label>
            <input
              id="cp-current"
              type={show ? "text" : "password"}
              className="field"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="cp-new">
              New password
            </label>
            <input
              id="cp-new"
              type={show ? "text" : "password"}
              className="field"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              required
            />
            <p className="text-xs text-muted mt-1.5">At least {MIN_LENGTH} characters.</p>
          </div>

          <div>
            <label className="label" htmlFor="cp-confirm">
              Confirm new password
            </label>
            <input
              id="cp-confirm"
              type={show ? "text" : "password"}
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            {confirm.length > 0 && confirm !== next && (
              <p className="text-xs text-red-600 mt-1.5">Passwords do not match.</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Show passwords
          </label>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
