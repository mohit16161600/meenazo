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
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const parts = pathname.split("/").filter(Boolean); // e.g. ["panel","products","15"]
  const seg = parts[1];

  // "/panel" itself → let the index page redirect (to /dashboard).
  if (!seg) return withNoIndex(NextResponse.next());

  // Unknown panel section → this is a "wrong URL": send them to the website.
  if (!PANEL_SEGMENTS.includes(seg)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Public panel pages (login, setup) are always reachable.
  const isPublic = PANEL_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return withNoIndex(NextResponse.next());

  // Protected pages: no session cookie → bounce to login.
  if (!req.cookies.get(PANEL_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/panel/login", req.url));
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
