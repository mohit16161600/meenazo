import { cn } from "@/utils/cn";

/**
 * Renders trusted article HTML (from the blog data) with hand-rolled "prose"
 * styling. We target child elements with arbitrary variants because the
 * @tailwindcss/typography plugin is not installed.
 */
export function ArticleBody({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-none text-[16px] text-ink",
        // Paragraphs
        "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted",
        // Headings
        "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink",
        // Blockquote
        "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink",
        // Lists
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted [&_ul]:marker:text-brand",
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-muted [&_ol]:marker:text-brand",
        "[&_li]:mb-1.5 [&_li]:leading-relaxed",
        // Inline
        "[&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-dark",
        "[&_strong]:font-bold [&_strong]:text-ink",
        // Media / rules
        "[&_img]:my-6 [&_img]:rounded-brand",
        "[&_hr]:my-8 [&_hr]:border-line",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
