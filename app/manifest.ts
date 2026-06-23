import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

/**
 * PWA web app manifest — enables "Add to Home Screen" with brand identity.
 * Uses the maskable brand SVG (app/icon.svg) so the manifest is installable.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5b8c6e",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "maskable" },
    ],
  };
}
