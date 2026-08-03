/**
 * Panel role-based access control — ONE source of truth for who can see/do what.
 * Edge-safe (no node/deps) so middleware, the server layout and the sidebar can
 * all share it.
 *
 * A "resource" maps 1:1 to a panel section / API resource name (products,
 * blog, orders, …) plus the special sections dashboard, settings and users.
 * `canAccess()` is enforced BOTH in the API routes (the real security
 * boundary) and in the sidebar / page guard (UX).
 */

export type PanelResource =
  | "dashboard"
  /** Deep order/revenue analytics - same data class as orders, gated with it. */
  | "analytics"
  | "products"
  | "categories"
  | "blog"
  | "orders"
  | "customers"
  | "coupons"
  | "banners"
  | "testimonials"
  | "faqs"
  | "settings"
  | "users"
  /** System health page — env/API/token diagnostics. Admin-only (via "*"). */
  | "system";

export interface RoleDef {
  label: string;
  description: string;
  /** "*" = every resource, else the explicit allow-list. */
  resources: "*" | PanelResource[];
}

export const PANEL_ROLES: Record<string, RoleDef> = {
  admin: {
    label: "Administrator",
    description: "Full access to everything, including admin users & site settings.",
    resources: "*",
  },
  manager: {
    label: "Store Manager",
    description: "Runs the store — products, orders, offers & content. No admin-user or site-settings control.",
    resources: [
      "dashboard",
      "analytics",
      "products",
      "categories",
      "orders",
      "customers",
      "coupons",
      "banners",
      "testimonials",
      "blog",
      "faqs",
    ],
  },
  editor: {
    label: "Content Editor",
    description:
      "Edits ALL site content — products, categories, blog, banners, testimonials & FAQs. No orders, customers or coupons.",
    resources: [
      "dashboard",
      "products",
      "categories",
      "blog",
      "banners",
      "testimonials",
      "faqs",
    ],
  },
  seo: {
    label: "SEO / Content",
    description: "SEO & blog only — blog posts and FAQs. No product edit, no orders, no pricing.",
    resources: ["dashboard", "blog", "faqs"],
  },
};

/** Default role pre-selected when CREATING a user (never used for authorization). */
export const DEFAULT_ROLE = "editor";

/** Fail-closed definition for blank/unknown roles: no access at all. */
const NO_ACCESS: RoleDef = {
  label: "No access",
  description: "Unrecognized role — denied everywhere until an admin assigns a valid one.",
  resources: [],
};

export function isValidRole(role: unknown): role is keyof typeof PANEL_ROLES {
  return typeof role === "string" && Object.prototype.hasOwnProperty.call(PANEL_ROLES, role);
}

/**
 * SECURITY: unknown/blank roles resolve to NO access (fail closed), not to a
 * default role — an unrecognized principal must be denied, never granted.
 */
export function roleDef(role: string | undefined | null): RoleDef {
  return isValidRole(role) ? PANEL_ROLES[role] : NO_ACCESS;
}

export function roleLabel(role: string | undefined | null): string {
  return roleDef(role).label;
}

/** Can this role use this section / API resource? */
export function canAccess(role: string | undefined | null, resource: string): boolean {
  const def = roleDef(role);
  if (def.resources === "*") return true;
  return (def.resources as string[]).includes(resource);
}

/** Options for the role dropdown in the admin-users form. */
export const ROLE_OPTIONS = Object.entries(PANEL_ROLES).map(([value, def]) => ({
  value,
  label: def.label,
}));
