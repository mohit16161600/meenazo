"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/utils/format";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Prefill once the user session resolves.
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const avatar = user?.avatar || user?.name?.trim()?.charAt(0)?.toUpperCase() || "🌿";
  const isEmoji = !user?.name; // fallback emoji vs initial

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Name required", "Please enter your full name.");
      return;
    }
    if (phone.trim() && !/^[\d\s+-]{7,15}$/.test(phone.trim())) {
      error("Invalid phone", "Please enter a valid contact number.");
      return;
    }

    setSaving(true);
    const res = await updateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
    setSaving(false);

    if (res.success) {
      success("Profile updated", res.message);
    } else {
      error("Update failed", res.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-ink">Profile</h2>

      {/* Profile header card */}
      <div className="card-surface p-6 flex items-center gap-4">
        <span
          className="grid place-items-center h-16 w-16 rounded-full bg-mint text-2xl font-extrabold text-brand-dark shrink-0"
          aria-hidden
        >
          {isEmoji ? "🌿" : avatar}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-ink text-lg">{user?.name}</p>
          <p className="text-sm text-muted truncate">{user?.email}</p>
          {user?.createdAt && (
            <p className="text-xs text-muted mt-1">Member since {formatDate(user.createdAt)}</p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="card-surface p-6">
        <h3 className="font-bold text-ink mb-4">Personal details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="profile-name">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="profile-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="profile-email">
              Email address
            </label>
            <input
              id="profile-email"
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="profile-phone">
              Phone number
            </label>
            <input
              id="profile-phone"
              className="field"
              inputMode="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
