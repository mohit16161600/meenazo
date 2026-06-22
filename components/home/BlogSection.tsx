import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { blogPosts } from "@/data/blog";
import { formatDate } from "@/utils/format";

/** Latest journal posts — three-up blog card grid. */
export function BlogSection() {
  const posts = blogPosts.slice(0, 3);

  return (
    <section className="section-y">
      <Container>
        <SectionHeader
          eyebrow="Journal"
          title="From the Ayurveda blog"
          subtitle="Doctor-written guides, herb deep-dives and practical wellness rituals."
          action={
            <Button href="/blog" variant="ghost">
              Read all
            </Button>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card-surface card-hover group flex flex-col overflow-hidden animate-fadeIn"
            >
              <ArtPlaceholder
                emoji={post.emoji}
                gradient={post.gradient}
                src={post.image}
                alt={post.title}
                fit="cover"
                className="h-44 rounded-none"
                fontSize={64}
              />
              <div className="flex flex-1 flex-col p-5">
                <span className="chip chip-soft self-start">{post.category}</span>
                <h3 className="mt-3 text-[18px] font-bold leading-snug text-ink transition-colors group-hover:text-brand line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>

                <div className="mt-auto flex items-center gap-2.5 pt-5 text-xs text-muted">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full bg-mint text-base"
                    aria-hidden
                  >
                    {post.authorAvatar}
                  </span>
                  <span className="font-semibold text-ink">{post.author}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(post.date)}</span>
                  <span aria-hidden>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
