"use client";

import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/utils/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Single-row email subscribe form. Reused by the home Newsletter section and the
 * site Footer (pass `dark` on dark backgrounds).
 */
export function NewsletterForm({ dark }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const toast = useToast();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      toast.error("Invalid email", "Please enter a valid email address.");
      return;
    }
    toast.success("Subscribed!", "Welcome to Meenazo — your 15% off code is on its way.");
    setEmail("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3"
      noValidate
      aria-label="Newsletter signup"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={cn(
          "field field-pill flex-1",
          dark &&
            "bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
        )}
      />
      <Button type="submit" variant={dark ? "primary" : "dark"} className="shrink-0">
        Subscribe
      </Button>
    </form>
  );
}

/** Full home newsletter section — centered mint panel with first-order offer. */
export function Newsletter() {
  return (
    <section className="section-y">
      <Container>
        <div className="bg-mint rounded-brand px-6 py-12 md:px-12 md:py-16 text-center animate-fadeIn">
          <SectionHeader
            center
            eyebrow="Stay well"
            title="Get 15% off your first order"
            subtitle="Join thousands on the Meenazo journey. Receive authentic Ayurvedic wellness tips, early access to new arrivals and member-only offers — straight to your inbox."
            className="mb-0"
          />
          <div className="mx-auto mt-7 max-w-[430px]">
            <NewsletterForm />
            <p className="mt-3 text-xs text-muted">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
