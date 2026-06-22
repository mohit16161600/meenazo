import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Checkout",
  path: "/checkout",
});

export default function CheckoutPage() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
          className="mb-5"
        />

        <header className="mb-8">
          <span className="eyebrow">Secure checkout</span>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">Checkout</h1>
          <p className="mt-2 max-w-xl text-muted">
            Review your order, add your delivery details and place your order. Authentic Ayurveda,
            delivered to your door.
          </p>
        </header>

        <CheckoutForm />
      </Container>
    </section>
  );
}
