"use client";

import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { ProtectedRoute } from "@/components/account/ProtectedRoute";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { useAuth } from "@/context/AuthContext";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  return (
    <ProtectedRoute>
      <section className="section-y bg-soft min-h-[70vh]">
        <Container>
          <header className="mb-8 animate-fadeIn">
            <span className="eyebrow text-brand">My Account</span>
            <h1 className="mt-1.5 text-3xl font-extrabold text-ink">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"} 🌿
            </h1>
            <p className="mt-2 text-muted">
              Manage your orders, addresses and wellness profile — all in one calm place.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
            <aside>
              <AccountSidebar />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </Container>
      </section>
    </ProtectedRoute>
  );
}
