import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PANEL_COOKIE,
  PANEL_PUBLIC_PATHS,
  PANEL_SEGMENTS,
} from "@/lib/panelConstants";

/**
 * Security gate for the admin panel (Edge middleware — no Node APIs here).
 *
 *  1. Any unknown /panel/* URL  →  redirected to the public website ("/"),
 *     so a stranger poking at random URLs never sees the panel exists.
 *  2. Protected /panel pages require a session cookie; otherwise → /panel/login.
 *     (The cookie is cryptographically re-verified server-side in the panel
 *     layout and in every /api/panel route — this is just the first gate.)
 *  3. /panel responses are marked noindex so search engines never list them.
 *
 * NOTE: this only guards the pages. The JSON API under /api/panel enforces its
 * own auth (requireAuth) and is intentionally not matched here.
 */
/** Canonical public origin, used when the request's own host is unusable. */
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meenazo.com";

/**
 * Point `url` at `host`, which may or may not carry its own port.
 *
 * The URL `host` SETTER keeps the existing port when the assigned value has
 * none — so `url.host = "meenazo.com"` on `http://localhost:3000/x` yields
 * `meenazo.com:3000`, leaking the app's internal port into a public redirect.
 * Assigning hostname and port separately is the only way to clear it.
 */
function setHost(url: URL, host: string): void {
  const [hostname, port] = host.split(":");
  url.hostname = hostname;
  url.port = port ?? "";
}

/**
 * Build an absolute redirect URL that never points a real visitor at localhost.
 * Behind the production reverse proxy Next.js sees the request as
 * `http://localhost:3000/...`, so `new URL(path, req.url)` would redirect the
 * BROWSER to localhost:3000 (the visitor's own machine).
 *
 * We prefer the proxy's `x-forwarded-host`, but the SCHEME is never taken from
 * the request in production: proxies commonly report the INTERNAL hop as
 * `x-forwarded-proto: http`, which would bounce visitors to an http:// URL and
 * trip the browser's "Not secure" warning. The live site is https-only.
 */
function redirectTo(req: NextRequest, path: string): NextResponse {
  const url = new URL(path, req.url);
  const fwdHost = req.headers.get("x-forwarded-host");
  if (fwdHost) setHost(url, fwdHost);

  if (process.env.NODE_ENV === "production") {
    if (/^(localhost|127\.0\.0\.1)$/i.test(url.hostname)) {
      setHost(url, new URL(SITE_ORIGIN).host);
    }
    url.protocol = "https:";
  }
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const parts = pathname.split("/").filter(Boolean); // e.g. ["panel","products","15"]
  const seg = parts[1];

  // "/panel" itself → let the index page redirect (to /dashboard).
  if (!seg) return withNoIndex(NextResponse.next());

  // Unknown panel section → this is a "wrong URL": send them to the website.
  if (!PANEL_SEGMENTS.includes(seg)) {
    return redirectTo(req, "/");
  }

  // Public panel pages (login, setup) are always reachable.
  const isPublic = PANEL_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return withNoIndex(NextResponse.next());

  // Protected pages: no session cookie → bounce to login.
  if (!req.cookies.get(PANEL_COOKIE)?.value) {
    return redirectTo(req, "/panel/login");
  }

  return withNoIndex(NextResponse.next());
}

function withNoIndex(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
