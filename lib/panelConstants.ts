/**
 * Edge-safe panel constants (no Node APIs) so both the Edge `middleware.ts`
 * and the Node-side `panelAuth.ts` can share them.
 */
export const PANEL_COOKIE = "meenazo_panel_session";

/** Pages under /panel that do NOT require a login. */
export const PANEL_PUBLIC_PATHS = ["/panel/login", "/panel/setup"];

/** The only valid first segments under /panel. Anything else is treated as a
 *  bad URL and the visitor is sent to the public website. Keep in sync with NAV. */
export const PANEL_SEGMENTS = [
  "dashboard",
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
