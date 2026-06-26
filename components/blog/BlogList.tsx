"use client";

import { useState } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/utils/cn";
import type { BlogPost } from "@/types";

/**
 * Client-side blog listing: renders the topic filter chips and the post grid,
 * filtering instantly in the browser. Keeping the filter on the client lets the
 * /blog route stay static (no per-request server render) while clicks feel
 * instant — no full-page navigation.
 */
export function BlogList({
  posts,
  categories,
}: {
  posts: BlogPost[];
  categories: string[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const filtered = active ? posts.filter((p) => p.category === active) : posts;
  const [featured, ...rest] = filtered;

  const chipBase = "chip transition-colors cursor-pointer";
  const chipIdle = "chip-soft hover:bg-brand hover:text-white";

  return (
    <>
      {categories.length > 0 && (
        <ul className="mt-7 flex flex-wrap gap-2.5" aria-label="Blog topics">
          <li>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-pressed={active === null}
              className={cn(chipBase, active !== null && chipIdle)}
            >
              All
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={active === cat}
                className={cn(chipBase, active !== cat && chipIdle)}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 pb-20 md:mt-12">
        {filtered.length === 0 ? (
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
      </div>
    </>
  );
}
