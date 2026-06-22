import type { Config } from "tailwindcss";

/**
 * VedaPure design system — ported from /demo/template-1-clean.html
 * Brand palette lives both here (as Tailwind tokens) and in globals.css (as CSS vars).
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5b8c6e",
          dark: "#3f6b51",
          light: "#a8d7bd",
        },
        mint: "#eaf3ee",
        ink: "#1f2a24",
        muted: "#6b7a72",
        line: "#e6ece8",
        soft: "#f6f9f7",
        gold: "#e0a93f",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      maxWidth: {
        wrap: "1180px",
      },
      borderRadius: {
        brand: "16px",
      },
      boxShadow: {
        brand: "0 8px 30px rgba(31,42,36,.07)",
        "brand-lg": "0 18px 50px rgba(31,42,36,.12)",
      },
      letterSpacing: {
        eyebrow: ".12em",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(255,255,255,.45)" },
          "70%": { boxShadow: "0 0 0 22px rgba(255,255,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.2s infinite",
        fadeIn: "fadeIn .4s ease both",
        slideUp: "slideUp .3s cubic-bezier(.16,1,.3,1) both",
        marquee: "marquee 28s linear infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
