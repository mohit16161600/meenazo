"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { GA_MEASUREMENT_ID } from "@/data/site";

/**
 * Google Analytics 4 (gtag.js).
 * ---------------------------------------------------------------------------
 * Three deliberate refusals, all for the same reason — the numbers are only
 * worth having if they describe CUSTOMERS:
 *
 *   • Not on /panel. The owner and staff work in the admin all day; counting
 *     that traffic would drown the shop's real sessions in our own.
 *   • Not in development. `npm run dev` would otherwise post localhost hits to
 *     the live property, and there is no undoing that once it is in a report.
 *   • Not without an id. A blank NEXT_PUBLIC_GA_ID switches tracking off
 *     cleanly instead of loading a script that 404s.
 *
 * `afterInteractive` loads it once the page is usable, so the tag never
 * competes with the shop's own rendering.
 *
 * Route changes: the App Router navigates with the History API, and GA4's
 * Enhanced Measurement ("page changes based on browser history events", on by
 * default) records those as page views on its own. No manual page_view is sent
 * here — doing both is how a site ends up double-counting every click.
 */
export function Analytics() {
  const pathname = usePathname();

  if (!GA_MEASUREMENT_ID) return null;
  if (process.env.NODE_ENV !== "production") return null;
  if (pathname?.startsWith("/panel")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/* The init snippet is a plain inline <script>, not next/script, so it is
          in the server-rendered HTML rather than injected after hydration —
          which means it is verifiable in `view-source` and cannot be lost if
          hydration is slow or fails. This is exactly Google's own documented
          pattern: the queue is filled synchronously and gtag.js drains it
          whenever the async library finishes loading. */}
      <script
        id="ga4-init"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`,
        }}
      />
    </>
  );
}
