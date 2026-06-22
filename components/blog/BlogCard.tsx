import Link from "next/link";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import type { BlogPost } from "@/types";

/** Author + date + read-time meta row shared by both card variants. */
function MetaRow({ post }: { post: BlogPost }) {
  return (
    <div className="mt-4 flex items-center gap-2.5 text-sm text-muted">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-lg"
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
  );
}

/**
 * Card linking to an article. Default is a vertical card; `featured` renders a
 * larger horizontal layout for the lead post in the blog listing.
 */
export function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const href = `/blog/${post.slug}`;

  if (featured) {
    return (
      <article className="card-surface card-hover group animate-fadeIn">
        <Link href={href} className="grid items-stretch md:grid-cols-2" aria-label={post.title}>
          <ArtPlaceholder
            emoji={post.emoji}
            gradient={post.gradient}
            src={post.image}
            alt={post.title}
            fit="cover"
            className="aspect-[16/10] w-full md:aspect-auto md:h-full md:min-h-[20rem]"
            fontSize={120}
          />
          <div className="flex flex-col justify-center p-6 md:p-9">
            <div>
              <Badge variant="soft">{post.category}</Badge>
            </div>
            <h3 className="mt-3 text-2xl font-bold leading-snug text-ink transition-colors group-hover:text-brand md:text-3xl">
              {post.title}
            </h3>
            <p className="mt-3 line-clamp-3 leading-relaxed text-muted">{post.excerpt}</p>
            <MetaRow post={post} />
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="card-surface card-hover group flex h-full flex-col animate-fadeIn">
      <Link href={href} className="flex h-full flex-col" aria-label={post.title}>
        <ArtPlaceholder
          emoji={post.emoji}
          gradient={post.gradient}
          src={post.image}
          alt={post.title}
          fit="cover"
          className="aspect-[16/10] w-full"
        />
        <div className="flex flex-1 flex-col p-5">
          <div>
            <Badge variant="soft">{post.category}</Badge>
          </div>
          <h3
            className={cn(
              "mt-3 line-clamp-2 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand"
            )}
          >
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
          <div className="mt-auto">
            <MetaRow post={post} />
          </div>
        </div>
      </Link>
    </article>
  );
}
