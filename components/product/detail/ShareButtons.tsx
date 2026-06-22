"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { useToast } from "@/context/ToastContext";
import { SITE_URL } from "@/data/site";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/ui/Icon";

/** Resolve the canonical, shareable URL for a product (client-safe). */
function productUrl(slug: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/product/${slug}`;
  }
  return `${SITE_URL}/product/${slug}`;
}

/** Copy link + native social share buttons for the product page. */
export function ShareButtons({ product, className }: { product: Product; className?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const url = productUrl(product.slug);
  const text = `Check out ${product.name} on Meenazo`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied", "Share it with friends & family");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link", "Please copy it manually from the address bar.");
    }
  };

  const open = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=520");
  };

  const targets: { label: string; icon: string; onClick: () => void }[] = [
    {
      label: copied ? "Copied" : "Copy link",
      icon: copied ? "check" : "copy",
      onClick: copyLink,
    },
    {
      label: "WhatsApp",
      icon: "whatsapp",
      onClick: () => open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`),
    },
    {
      label: "Facebook",
      icon: "facebook",
      onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    },
    {
      label: "Twitter",
      icon: "twitter",
      onClick: () =>
        open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        ),
    },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted mr-1">Share</span>
      {targets.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={t.onClick}
          aria-label={`Share on ${t.label}`}
          title={t.label}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-line bg-white text-ink hover:border-brand hover:bg-mint hover:text-brand transition-colors"
        >
          <Icon name={t.icon} size={16} />
        </button>
      ))}
    </div>
  );
}
