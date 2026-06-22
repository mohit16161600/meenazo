import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

/**
 * PWA web app manifest — enables "Add to Home Screen" with
 * brand identity. Icons are intentionally omitted (no real
 * image assets); the array stays valid and empty.
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
    icons: [],
  };
}
