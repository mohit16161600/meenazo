import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CartView } from "@/components/cart/CartView";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Your Cart",
  description:
    "Review the Ayurvedic essentials in your Meenazo cart, apply a coupon and proceed to a secure checkout.",
  path: "/cart",
});

export default function CartPage() {
  return (
    <section className="section-y">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} className="mb-4" />
        <span className="eyebrow">Shopping cart</span>
        <h2 className="mt-1.5 mb-8">Your cart</h2>

        <CartView />
      </Container>
    </section>
  );
}
