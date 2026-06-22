/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Keep production builds resilient; lint is still available via `npm run lint`.
    ignoreDuringBuilds: true,
  },
  images: {
    // Allow our own branded SVG placeholders to be served via next/image.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    // Default dummy data uses gradient/emoji placeholders (offline-safe).
    // Remote patterns are pre-configured so real CDN/Laravel image URLs work later.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
