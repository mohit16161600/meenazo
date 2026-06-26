import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BlogList } from "@/components/blog/BlogList";
import { blogPosts } from "@/data/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Ayurveda Blog",
  description:
    "Doctor-written guides on Ayurvedic herbs, doshas, immunity and holistic wellness — practical, research-backed wisdom from the Meenazo journal.",
  path: "/blog",
});

// Fully static — newest-first posts and topics are known at build time, and the
// category filter runs on the client (see <BlogList>), so there's no per-request
// server work.
export default function BlogPage() {
  const categories = Array.from(new Set(blogPosts.map((p) => p.category)));
  const posts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-soft">
        <Container className="py-12 md:py-16">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Blog" }]}
            className="mb-5"
          />
          <div className="max-w-2xl">
            <span className="eyebrow">Journal</span>
            <h2 className="mt-1.5">The Ayurveda Journal</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
              Practical, research-backed wisdom from our Ayurvedic doctors — herbs and their
              benefits, understanding your dosha, and simple daily rituals for lasting balance.
            </p>
          </div>
        </Container>
      </section>

      {/* Topics + posts (client-filtered) */}
      <section>
        <Container>
          <BlogList posts={posts} categories={categories} />
        </Container>
      </section>
    </>
  );
}
