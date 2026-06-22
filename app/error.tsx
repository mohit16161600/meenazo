"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";

/**
 * Route-segment error boundary. Catches render/runtime errors,
 * logs them, and offers a calm recovery path.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for diagnostics; swap for real logging later.
    console.error(error);
  }, [error]);

  return (
    <section className="section-y">
      <Container className="max-w-2xl text-center animate-fadeIn">
        <div className="flex justify-center mb-8">
          <ArtPlaceholder
            emoji="🍃"
            gradient={["#f6efe8", "#f0e4d6"]}
            className="h-32 w-32 rounded-brand shadow-brand"
            fontSize={64}
          />
        </div>

        <p className="eyebrow">Something interrupted</p>
        <h1 className="text-3xl md:text-4xl font-bold text-ink mt-3 mb-4">
          Something went wrong
        </h1>
        <p className="text-muted text-lg max-w-md mx-auto mb-8">
          We hit an unexpected snag while preparing this page. Take a breath —
          you can try again, and if it persists our wellness team is here to help.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <Button href="/" variant="ghost" size="lg">
            Back to Home
          </Button>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-muted">
            Reference code:{" "}
            <span className="font-mono text-ink">{error.digest}</span>
          </p>
        )}

        <p className="mt-6 text-sm text-muted">
          Need a hand?{" "}
          <Link href="/contact" className="text-brand font-semibold hover:text-brand-dark transition">
            Contact our support team
          </Link>
          .
        </p>
      </Container>
    </section>
  );
}
