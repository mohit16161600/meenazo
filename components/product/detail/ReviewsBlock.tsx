"use client";

import { useState } from "react";
import type { Product, Review } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

/** Distribution of star counts (1-5) across the review list. */
function buildDistribution(reviews: Review[]): Record<number, number> {
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (dist[star] != null) dist[star] += 1;
  }
  return dist;
}

/** Rating summary + review list + a non-persisted "Write a review" form. */
export function ReviewsBlock({ product }: { product: Product }) {
  const toast = useToast();
  const reviews = product.reviews ?? [];

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      toast.error("Please complete the form", "Add your name and a short review.");
      return;
    }
    toast.success("Thank you for your review!", "It will appear after moderation.");
    setName("");
    setComment("");
    setRating(5);
    setShowForm(false);
  };

  const distribution = buildDistribution(reviews);

  return (
    <div id="reviews-list" className="scroll-mt-28">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-2xl font-bold text-ink">Customer Reviews</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "Write a review"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-[auto,1fr] gap-6 md:gap-10 items-center rounded-brand border border-line bg-soft p-6 mb-8">
        <div className="text-center md:border-r md:border-line md:pr-10">
          <div className="text-5xl font-extrabold text-ink leading-none">
            {product.rating.toFixed(1)}
          </div>
          <StarRating rating={product.rating} size="md" className="mt-2 justify-center" />
          <p className="text-sm text-muted mt-1">
            {product.reviewCount.toLocaleString("en-IN")} ratings
          </p>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const total = reviews.length || 1;
            const pct = reviews.length ? (distribution[star] / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-muted tabular-nums">{star}★</span>
                <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted tabular-nums">{distribution[star]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write a review form */}
      {showForm && (
        <form onSubmit={submit} className="rounded-brand border border-line bg-white p-6 mb-8 animate-fadeIn">
          <h4 className="font-bold text-ink mb-4">Share your experience</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="rv-name">Your name</label>
              <input
                id="rv-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
                placeholder="e.g. Priya S."
              />
            </div>
            <div>
              <span className="label">Your rating</span>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    onClick={() => setRating(star)}
                    className={cn(
                      "text-2xl leading-none transition-transform hover:scale-110",
                      star <= rating ? "text-gold" : "text-line"
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="rv-comment">Your review</label>
            <textarea
              id="rv-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="field resize-none"
              placeholder="What did you like? Did it help with your wellness goals?"
            />
          </div>
          <Button type="submit" className="mt-4">Submit review</Button>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <EmptyState
          emoji="✍️"
          title="No reviews yet"
          message="Be the first to share how this formula worked for you."
          actionLabel="Write a review"
        >
          <Button onClick={() => setShowForm(true)}>Write a review</Button>
        </EmptyState>
      ) : (
        <ul className="space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-brand border border-line bg-white p-5">
              <div className="flex items-start gap-3">
                <span
                  className="w-10 h-10 rounded-full bg-mint flex items-center justify-center text-lg shrink-0"
                  aria-hidden
                >
                  {r.avatar}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{r.author}</span>
                    {r.verified && (
                      <span className="chip chip-soft !text-[10px]">✓ Verified buyer</span>
                    )}
                    <span className="text-xs text-muted ml-auto">{formatDate(r.date)}</span>
                  </div>
                  <StarRating rating={r.rating} className="mt-1.5" />
                  {r.title && <p className="font-semibold text-ink mt-2">{r.title}</p>}
                  <p className="text-sm text-muted leading-relaxed mt-1">{r.comment}</p>
                  {typeof r.helpful === "number" && r.helpful > 0 && (
                    <p className="text-xs text-muted mt-3">👍 {r.helpful} found this helpful</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
