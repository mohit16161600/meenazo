import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { BlogCard } from "@/components/blog/BlogCard";
import { blogPosts } from "@/data/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Ayurveda Blog",
  description:
    "Doctor-written guides on Ayurvedic herbs, doshas, immunity and holistic wellness — practical, research-backed wisdom from the Meenazo journal.",
  path: "/blog",
});

export default function BlogPage() {
  const posts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const [featured, ...rest] = posts;

  // Unique categories for the filter chip row.
  const categoriesList = Array.from(new Set(blogPosts.map((p) => p.category)));

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

          {categoriesList.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2.5" aria-label="Blog topics">
              <li>
                <Link
                  href="/blog"
                  className="chip chip-soft transition-colors hover:bg-brand hover:text-white"
                >
                  All
                </Link>
              </li>
              {categoriesList.map((cat) => (
                <li key={cat}>
                  <Link
                    href="/blog"
                    className="chip chip-soft transition-colors hover:bg-brand hover:text-white"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {/* Posts */}
      <section className="section-y">
        <Container>
          {posts.length === 0 ? (
            <EmptyState
              emoji="📖"
              title="No articles yet"
              message="Our doctors are busy writing. Check back soon for fresh Ayurvedic insights."
              actionLabel="Browse products"
              actionHref="/shop"
            />
          ) : (
            <>
              {featured && (
                <div className="mb-10 md:mb-14">
                  <BlogCard post={featured} featured />
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}
