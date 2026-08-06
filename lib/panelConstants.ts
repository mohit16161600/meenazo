/**
 * Edge-safe panel constants (no Node APIs) so both the Edge `middleware.ts`
 * and the Node-side `panelAuth.ts` can share them.
 */
export const PANEL_COOKIE = "meenazo_panel_session";

/** Pages under /panel that do NOT require a login. */
/**
 * Login is the ONLY page reachable without a session. /panel/setup used to be
 * here too, which meant a live site exposed the installer — and its errors —
 * to anyone who guessed the URL. It is now behind a session like every other
 * panel page, and the API additionally requires the `admin` role.
 */
export const PANEL_PUBLIC_PATHS = ["/panel/login"];

/** The only valid first segments under /panel. Anything else is treated as a
 *  bad URL and the visitor is sent to the public website. Keep in sync with NAV. */
export const PANEL_SEGMENTS = [
  "dashboard",
  "analytics",
  "products",
  "categories",
  "blog",
  "orders",
  "coupons",
  "banners",
  "testimonials",
  "faqs",
  "customers",
  "settings",
  "users",
  "system",
  "login",
  "setup",
];
