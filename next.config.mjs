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
    // An SVG can carry <script>. Without this CSP a hostile .svg optimised
    // through /_next/image executes on our origin (stored XSS).
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType: "attachment",
    // Explicit allow-list only. A `hostname: "**"` wildcard turns /_next/image
    // into an open image proxy for the whole internet — anyone can burn our
    // bandwidth/CPU rendering arbitrary remote files through this domain.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "meenazo.com" },
      { protocol: "https", hostname: "**.meenazo.com" },
      { protocol: "https", hostname: "sheopals.com" },
      { protocol: "https", hostname: "**.sheopals.com" },
      { protocol: "https", hostname: "sheopalscrm.in" },
    ],
  },

  /** Baseline security headers for every response. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        // Never let an API response be cached by a proxy/CDN — they carry
        // per-session order and account data.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
