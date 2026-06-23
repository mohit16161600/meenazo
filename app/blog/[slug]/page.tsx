import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { blogPosts, getBlogBySlug, getRelatedBlogs } from "@/data/blog";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/utils/format";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

// Blog posts are fully enumerable — any unknown slug is a real 404 (no soft-404).
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) return buildMetadata({ title: "Article not found", path: `/blog/${slug}` });

  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) notFound();

  const related = getRelatedBlogs(slug, 3);

  return (
    <>
      <article>
        <Container className="py-8 md:py-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              { label: post.title },
            ]}
            className="mb-7"
          />

          {/* Article header */}
          <header className="mx-auto max-w-3xl text-center">
            <Badge variant="soft">{post.category}</Badge>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink md:text-[40px] md:leading-[1.15]">
              {post.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-sm text-muted">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-xl"
                aria-hidden
              >
                {post.authorAvatar}
              </span>
              <span className="font-semibold text-ink">{post.author}</span>
              <span className="text-line">•</span>
              <span>{formatDate(post.date)}</span>
              <span className="text-line">•</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          {/* Hero art */}
          <ArtPlaceholder
            emoji={post.emoji}
            gradient={post.gradient}
            src={post.image}
            alt={post.title}
            fit="cover"
            className="mx-auto mt-8 aspect-[16/9] w-full max-w-4xl rounded-brand shadow-brand md:mt-10"
            fontSize={140}
          />

          {/* Body */}
          <div className="mx-auto mt-10 max-w-3xl md:mt-12">
            <ArticleBody html={post.content} />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
                <span className="mr-1 text-sm font-semibold text-ink">Tags</span>
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="soft">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Back link */}
            <div className="mt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
              >
                <span aria-hidden>←</span> Back to all articles
              </Link>
            </div>
          </div>
        </Container>
      </article>

      {/* Newsletter / consult CTA */}
      <section className="section-y bg-mint">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Personalised guidance</span>
            <h2 className="mt-1.5">Not sure where to start?</h2>
            <p className="mx-auto mt-2.5 max-w-xl text-[15px] leading-relaxed text-muted">
              Take the guesswork out of Ayurveda. Explore our doctor-formulated range or reach out
              for a free wellness consultation tailored to your constitution.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href="/shop">Shop the range</Button>
              <Button href="/contact" variant="ghost">
                Talk to an expert
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="section-y">
          <Container>
            <SectionHeader
              eyebrow="Keep reading"
              title="Related articles"
              subtitle="More Ayurvedic wisdom curated for you."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
