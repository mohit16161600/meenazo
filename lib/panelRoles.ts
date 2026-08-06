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
  /** Global SEO settings — site-wide metadata, verification and analytics IDs. */
  | "seo"
  | "users"
  /** System health page — env/API/token diagnostics. Admin-only (via "*"). */
  | "system";

export interface RoleDef {
  label: string;
  description: string;
  /** "*" = every resource, else the explicit allow-list. */
  resources: "*" | PanelResource[];
  /**
   * Field-level narrowing: resource → the ONLY field keys this role may write.
   * Absent for a resource means "every field".
   *
   * This exists so the SEO team can own the search-facing side of a product —
   * titles, descriptions, schema, article copy — without being able to touch
   * price, stock or SKU. Access to a page and authority over every field on it
   * are different questions, and lumping them together forces a bad choice
   * between "can't do their job" and "can change the price".
   *
   * Enforced in the CRUD layer on every write; the form merely hides what it
   * knows it cannot save.
   */
  editableFields?: Partial<Record<PanelResource, string[]>>;
}

/** The SEO/social block, shared by every content role's allow-list. */
const SEO_KEYS = [
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "focusKeyword",
  "canonicalUrl",
  "robots",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
];

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
    description:
      "Owns everything search-facing: blog, FAQs, and the SEO + copy on products and categories. Cannot touch price, stock, SKU, orders or settings.",
    resources: ["dashboard", "blog", "faqs", "products", "categories", "seo"],
    editableFields: {
      // Search-facing copy and metadata only. Price, salePrice, stock, sku,
      // inStock, active, variants and the merchandising flags are absent on
      // purpose — this role can rewrite how a product is FOUND, never what it
      // costs or whether it sells.
      products: [
        ...SEO_KEYS,
        "shortDescription",
        "description",
        "benefits",
        "benefitDetails",
        "benefitsHeadline",
        "howToUse",
        "howToUseSteps",
        "howToUseHeadline",
        "ingredients",
        "comparison",
        "faq",
        "highlights",
        "tags",
        "images",
      ],
      categories: [...SEO_KEYS, "description", "longDescription", "image"],
    },
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

/**
 * The field keys a role may write on a resource, or `null` for "all of them".
 * Returning null rather than a list keeps the common case free of bookkeeping.
 */
export function editableFields(
  role: string | undefined | null,
  resource: string
): string[] | null {
  const def = roleDef(role);
  const list = def.editableFields?.[resource as PanelResource];
  return list ?? null;
}

/** Can this role write this specific field? */
export function canEditField(
  role: string | undefined | null,
  resource: string,
  key: string
): boolean {
  const allowed = editableFields(role, resource);
  return allowed === null || allowed.includes(key);
}

/** Options for the role dropdown in the admin-users form. */
export const ROLE_OPTIONS = Object.entries(PANEL_ROLES).map(([value, def]) => ({
  value,
  label: def.label,
}));
