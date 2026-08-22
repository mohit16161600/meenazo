import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore: CSS side-effect import type declarations
import "./globals.css";
import { siteConfig, SITE_URL } from "@/data/site";
import { Providers } from "@/components/layout/Providers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChromeGate } from "@/components/layout/ChromeGate";
import { Analytics } from "@/components/layout/Analytics";
import { organizationJsonLd, jsonLdScript } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Ayurveda", "Ayurvedic supplements", "herbal", "wellness", "immunity", "diabetes", siteConfig.name],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  // NOTE: no `verification` here on purpose. Every storefront page builds its
  // own metadata through lib/seo.buildSeoMetadata, and a page-level
  // `verification` REPLACES the layout's rather than merging with it — so a
  // token declared here would appear on /panel and on nothing Google looks at.
  // The real one lives in data/seo.ts (Panel → SEO settings).
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd())} />
        <Analytics />
        <Providers>
          <ChromeGate
            top={
              <>
                <AnnouncementBar />
                <Header />
              </>
            }
            bottom={<Footer />}
          >
            {children}
          </ChromeGate>
        </Providers>
      </body>
    </html>
  );
}
