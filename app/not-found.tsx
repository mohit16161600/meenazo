import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Icon } from "@/components/ui/Icon";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Page Not Found",
  description: "The page you're looking for has wandered off the path. Explore our Ayurvedic remedies, journal and more.",
  path: "/404",
});

const helpfulLinks: { label: string; href: string; icon: string; description: string }[] = [
  { label: "Shop", href: "/shop", icon: "bag", description: "Browse all Ayurvedic remedies" },
  { label: "Blog", href: "/blog", icon: "info", description: "Wellness wisdom & guides" },
  { label: "Contact", href: "/contact", icon: "chat", description: "Talk to our experts" },
];

export default function NotFound() {
  return (
    <section className="section-y">
      <Container className="max-w-2xl text-center animate-fadeIn">
        <div className="flex justify-center mb-8">
          <ArtPlaceholder
            emoji="🌿"
            gradient={["#eaf3ee", "#cfe6d8"]}
            className="h-32 w-32 rounded-brand shadow-brand"
            fontSize={64}
          />
        </div>

        <p className="eyebrow">Error 404</p>
        <h1 className="text-3xl md:text-4xl font-bold text-ink mt-3 mb-4">
          Page not found
        </h1>
        <p className="text-muted text-lg max-w-md mx-auto mb-8">
          The page you&apos;re looking for has wandered off the path — perhaps it
          moved, or the link was mistyped. Let&apos;s get you back to balance.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/" size="lg">
            Back to Home <Icon name="arrow-right" size={18} />
          </Button>
          <Button href="/shop" variant="ghost" size="lg">
            Explore the Shop
          </Button>
        </div>

        <div className="mt-12 pt-10 border-t border-line">
          <p className="text-sm font-semibold text-ink mb-5">
            Or try one of these
          </p>
          <ul className="grid sm:grid-cols-3 gap-4">
            {helpfulLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="card-surface card-hover block p-5 text-left transition"
                >
                  <Icon name={link.icon} size={28} className="text-brand" />
                  <span className="block mt-3 font-semibold text-ink">
                    {link.label}
                  </span>
                  <span className="block text-sm text-muted mt-1">
                    {link.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
