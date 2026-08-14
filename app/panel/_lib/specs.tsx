import type { FieldSpec } from "../_components/fields";
import type { SeoSourceKeys } from "../_components/SeoPanel";
import { Badge } from "../_components/ui";
import { ROLE_OPTIONS } from "@/lib/panelRoles";

export interface Column {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
  /** Render an inline active/inactive switch bound to this boolean field. */
  toggle?: boolean;
  /**
   * Render a two-button segmented control instead of a switch. The button for
   * the CURRENT state is disabled, so it also reads as the status.
   */
  segmented?: boolean;
  /** Labels for the segmented control (default Active / Inactive). */
  onLabel?: string;
  offLabel?: string;
  /** Render an inline dropdown bound to this field (e.g. order status). */
  selectOptions?: { value: string; label: string }[];
  className?: string;
}

export interface ResourceConfig {
  name: string; // route + api segment
  title: string; // plural title
  singular: string;
  icon: string; // Icon name
  pkKey: string; // "id" | "code"
  /** Boolean field used by inline toggle + bulk activate/deactivate. */
  activeField?: string;
  /**
   * Boolean field the All / On / Off tabs filter by. Defaults to activeField;
   * set it when the two differ (products bulk-toggle "featured" but tab by
   * "active").
   */
  statusField?: string;
  statusOnLabel?: string;
  statusOffLabel?: string;
  /**
   * Render rows as a card grid instead of a table. Cards are built from the
   * SAME `columns` spec - the list page works out which is the thumbnail, which
   * is the title, which are details and which are inline controls - so nothing
   * has to be described twice.
   */
  cards?: boolean;
  columns: Column[];
  fields: FieldSpec[];
  hideCreate?: boolean;
  /**
   * Present = this resource is an indexable page, so the form shows the live
   * SEO preview + analyser. It names which form keys stand in for the title,
   * description and body when the SEO overrides are left blank.
   */
  seo?: SeoSourceKeys;
}

/**
 * The SEO block shared by every indexable resource. One definition, so a field
 * added here appears on products, categories and blog posts at once and cannot
 * drift between them.
 */
function seoFields(section = "SEO"): FieldSpec[] {
  return [
    { key: "focusKeyword", label: "Focus keyword", type: "text", section, help: "The one phrase this page should rank for. Drives the checks on the right." },
    { key: "seoTitle", label: "Meta title", type: "text", full: true, section, help: "30-60 characters. Blank = the page's own title." },
    { key: "seoDescription", label: "Meta description", type: "textarea", full: true, section, help: "120-160 characters. Blank = the page's own summary." },
    { key: "seoKeywords", label: "Keywords", type: "tags", full: true, section },
    { key: "canonicalUrl", label: "Canonical URL", type: "text", full: true, section, help: "Leave blank unless this page duplicates another one." },
    {
      key: "robots",
      label: "Search engines",
      type: "select",
      section,
      options: [
        { value: "index, follow", label: "Index & follow (default)" },
        { value: "noindex, follow", label: "Do not index" },
        { value: "index, nofollow", label: "Index, do not follow links" },
        { value: "noindex, nofollow", label: "Hide completely" },
      ],
    },
    { key: "ogTitle", label: "Social title", type: "text", full: true, section: "Social", help: "Facebook / WhatsApp / LinkedIn. Blank = meta title." },
    { key: "ogDescription", label: "Social description", type: "textarea", full: true, section: "Social" },
    { key: "ogImage", label: "Social image", type: "image", full: true, section: "Social", help: "1200x630 works everywhere." },
    { key: "twitterTitle", label: "X / Twitter title", type: "text", full: true, section: "Social" },
    { key: "twitterDescription", label: "X / Twitter description", type: "textarea", full: true, section: "Social" },
    { key: "twitterImage", label: "X / Twitter image", type: "image", full: true, section: "Social" },
  ];
}

/* ------------------------------ helpers ------------------------------ */
const money = (v: unknown) => (v == null || v === "" ? " - " : `₹${Number(v).toLocaleString("en-IN")}`);
/** Row thumbnail. `big` is used by the card layout, where there is room. */
const thumb = (row: Record<string, unknown>, big = false) => {
  const size = big ? "h-14 w-14" : "h-9 w-9";
  const img = Array.isArray(row.images) ? (row.images as string[])[0] : (row.image as string);
  if (img)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img} alt="" className={`${size} rounded-xl border border-line object-cover`} />;
  return (
    <span className={`flex ${size} items-center justify-center rounded-xl bg-mint ${big ? "text-2xl" : "text-lg"}`}>
      {String(row.emoji ?? "🌿")}
    </span>
  );
};
const emojiThumb = (row: Record<string, unknown>) => thumb(row);
/**
 * Round profile thumbnail for the reviewer/testimonial `avatar` field, which
 * holds either a photo path or an emoji. Mirrors <Avatar> on the storefront.
 */
const avatarThumb = (row: Record<string, unknown>) => {
  const v = String(row.avatar ?? "").trim();
  const isPhoto = v.startsWith("/") || v.startsWith("http") || v.startsWith("data:");
  if (isPhoto)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={v} alt="" className="h-9 w-9 rounded-full border border-line object-cover" />;
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-lg">
      {v || "🙂"}
    </span>
  );
};
const bigThumb = (row: Record<string, unknown>) => thumb(row, true);

interface CategoryProduct {
  id: string;
  name: string;
  sku: string | null;
  image: string | null;
  active: boolean;
  inStock: boolean;
}
const categoryProducts = (row: Record<string, unknown>): CategoryProduct[] =>
  Array.isArray(row.products) ? (row.products as CategoryProduct[]) : [];

/**
 * The category cards used to show the stock SVG icon (a droplet, a dumbbell),
 * which reads as a generic emoji rather than something you can recognise. Show
 * the first product's actual photo instead, falling back to the category's own
 * artwork and finally the emoji.
 *
 * Panel-only: the live website still uses the category's own image.
 */
const categoryThumb = (row: Record<string, unknown>) => {
  const own = typeof row.image === "string" && row.image.trim() ? row.image.trim() : null;
  const fromProduct = categoryProducts(row).find((p) => p.image)?.image ?? null;
  const img = fromProduct ?? own;
  if (img)
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={img}
        alt=""
        className="h-14 w-14 rounded-xl border border-line bg-white object-cover"
      />
    );
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-mint text-2xl">
      {String(row.emoji ?? "🌿")}
    </span>
  );
};

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "ndr", label: "NDR (delivery failed)" },
  { value: "returned", label: "Returned / RTO" },
];
const statusTone: Record<string, "green" | "amber" | "blue" | "red" | "neutral"> = {
  delivered: "green",
  confirmed: "blue",
  processing: "blue",
  shipped: "blue",
  out_for_delivery: "amber",
  pending: "amber",
  cancelled: "red",
  ndr: "red",
  returned: "red",
};

/* ------------------------------ Products ----------------------------- */
const products: ResourceConfig = {
  name: "products",
  title: "Products",
  seo: { titleKey: "name", descriptionKey: "shortDescription", contentKey: "description", slugKey: "slug", imageKey: "images", urlPrefix: "/product/" },
  singular: "Product",
  icon: "box",
  pkKey: "id",
  activeField: "isFeatured",
  // Tabs filter by published state; the bulk buttons still act on "featured".
  statusField: "active",
  statusOnLabel: "Active",
  statusOffLabel: "Inactive",
  // Products carry an image and three inline controls - far more readable as
  // cards than as a ten-column table that scrolls sideways.
  cards: true,
  columns: [
    { key: "_img", label: "", render: bigThumb },
    {
      key: "name",
      label: "Product",
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            {String(r.name)}
            {r.isBestSeller ? <Badge tone="amber">Best</Badge> : null}
            {r.isNewArrival ? <Badge tone="blue">New</Badge> : null}
          </div>
          <div className="text-xs text-muted">/{String(r.slug)}</div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (r) => <Badge>{String(r.category)}</Badge> },
    {
      key: "price",
      label: "Price",
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="font-semibold text-ink">{money(r.salePrice ?? r.price)}</span>
          {r.salePrice != null && (
            <span className="ml-1 text-xs text-muted line-through">{money(r.price)}</span>
          )}
        </div>
      ),
    },
    { key: "sku", label: "SKU", render: (r) => (r.sku ? <code className="rounded bg-soft px-1.5 py-0.5 text-xs">{String(r.sku)}</code> : <span className="text-xs text-muted">not set</span>) },
    {
      key: "stock",
      label: "Inventory",
      render: (r) =>
        Number(r.stock) <= 0 ? (
          <Badge tone="red">Out of stock</Badge>
        ) : Number(r.stock) <= 10 ? (
          <Badge tone="amber">{String(r.stock)} left</Badge>
        ) : (
          <span className="text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>{String(r.stock)}</span>
        ),
    },
    // The button for the state the row is already in is disabled, so these
    // columns read as status AND act as the control.
    { key: "active", label: "Status", segmented: true, onLabel: "Active", offLabel: "Inactive" },
    { key: "inStock", label: "Sellable", segmented: true, onLabel: "In stock", offLabel: "Out" },
    // Same control type as the two above - mixing a switch in beside them read
    // as two different systems on one row.
    { key: "isFeatured", label: "Featured", segmented: true, onLabel: "Yes", offLabel: "No" },
  ],
  fields: [
    { key: "id", label: "Product ID", type: "text", pk: true, required: true, section: "Basics", help: "Unique id, e.g. 16 (used by the order mapping)." },
    { key: "name", label: "Name", type: "text", required: true, section: "Basics" },
    { key: "slug", label: "Slug", type: "text", required: true, section: "Basics", help: "URL: /product/<slug>" },
    { key: "category", label: "Category", type: "ref", refResource: "categories", refValue: "slug", refLabel: "name", section: "Basics" },
    { key: "brand", label: "Brand", type: "text", section: "Basics" },
    { key: "sku", label: "EasyEcom SKU", type: "text", section: "Basics", help: "Master SKU used to push orders to EasyEcom. Must match the SKU in your EasyEcom catalog." },
    { key: "unit", label: "Unit", type: "text", placeholder: "60 capsules", section: "Basics" },
    { key: "price", label: "MRP (₹)", type: "number", required: true, section: "Pricing & stock" },
    { key: "salePrice", label: "Sale price (₹)", type: "number", section: "Pricing & stock", help: "Leave blank if not on sale." },
    { key: "currency", label: "Currency", type: "text", default: "INR", section: "Pricing & stock" },
    { key: "stock", label: "Inventory count", type: "number", section: "Pricing & stock" },
    {
      key: "active",
      label: "Active (visible on the website)",
      type: "checkbox",
      section: "Pricing & stock",
      default: true,
      help: "Switch off to retire a product: it keeps all its data here but disappears from the storefront.",
    },
    {
      key: "inStock",
      label: "In stock (can be ordered)",
      type: "checkbox",
      section: "Pricing & stock",
      default: true,
      help: "Stop sales immediately without touching the inventory count.",
    },
    { key: "dosage", label: "Dosage", type: "text", placeholder: "2 capsules per day", section: "Pricing & stock" },
    { key: "rating", label: "Rating", type: "number", step: 0.1, section: "Pricing & stock" },
    { key: "reviewCount", label: "Review count", type: "number", section: "Pricing & stock" },
    { key: "shortDescription", label: "Short description", type: "textarea", full: true, section: "Content" },
    { key: "description", label: "Full description", type: "textarea", full: true, section: "Content" },
    { key: "howToUse", label: "How to use", type: "textarea", full: true, section: "Content" },
    { key: "emoji", label: "Emoji", type: "text", placeholder: "⚖️", section: "Media" },
    { key: "gradient", label: "Art gradient", type: "gradient", section: "Media" },
    {
      key: "images",
      label: "Product photos",
      type: "imagelist",
      full: true,
      section: "Media",
      help: "First photo is the main one. Give each an alt description — it is what Google and screen readers read.",
    },
    { key: "video", label: "Video URL", type: "text", full: true, section: "Media" },
    { key: "benefits", label: "Benefits", type: "stringlist", full: true, section: "Details", help: "Short lines - used for the chips and quick lists." },
    { key: "benefitsHeadline", label: "Benefits subtitle", type: "text", full: true, section: "Details", placeholder: "Gentle, Ayurvedic support for..." },
    {
      key: "benefitDetails",
      label: "Benefit cards",
      type: "objectlist",
      full: true,
      section: "Details",
      help: "Longer benefit copy for the product page. Leave empty to reuse the short Benefits above.",
      subfields: [
        { key: "title", label: "Title", type: "text", placeholder: "Supports daily energy" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "image", label: "Illustration", type: "image" },
      ],
    },
    { key: "howToUseHeadline", label: "How-to-use subtitle", type: "text", full: true, section: "Content", placeholder: "3 simple steps for..." },
    {
      key: "howToUseSteps",
      label: "How-to-use steps",
      type: "objectlist",
      full: true,
      section: "Content",
      help: "The 3-step ritual band. Leave empty for the generic steps built from the dosage.",
      subfields: [
        { key: "title", label: "Step title", type: "text", placeholder: "Take daily" },
        { key: "description", label: "Step description", type: "textarea" },
        { key: "image", label: "Illustration", type: "image" },
      ],
    },
    {
      key: "comparison",
      label: "Comparison table",
      type: "objectlist",
      full: true,
      section: "Details",
      help: "One row per claim: what this product does vs what other products do. Leave empty to hide the section.",
      subfields: [
        { key: "ours", label: "This product", type: "text", placeholder: "Ayurvedic ingredients" },
        { key: "others", label: "Other products", type: "text", placeholder: "Synthetic filler ingredients" },
      ],
    },
    { key: "highlights", label: "Highlights", type: "stringlist", full: true, section: "Details" },
    { key: "tags", label: "Tags", type: "tags", full: true, section: "Details" },
    { key: "badges", label: "Badges", type: "tags", full: true, section: "Details", help: "e.g. Bestseller, 50% OFF" },
    {
      key: "variants",
      label: "Varieties / pack options",
      type: "objectlist",
      full: true,
      section: "Pricing & stock",
      help: "Optional purchase options (e.g. Pack of 2, Pack of 3). Orders record the chosen variety; its price overrides the base price.",
      subfields: [
        { key: "label", label: "Label", type: "text", placeholder: "Pack of 2 - 120 capsules" },
        { key: "unit", label: "Unit", type: "text", placeholder: "120 capsules" },
        { key: "price", label: "MRP (₹)", type: "number" },
        { key: "salePrice", label: "Sale price (₹)", type: "number" },
        { key: "sku", label: "EasyEcom SKU", type: "text", placeholder: "Optional - defaults to product SKU" },
      ],
    },
    {
      key: "ingredients",
      label: "Ingredients",
      type: "objectlist",
      full: true,
      section: "Details",
      subfields: [
        { key: "name", label: "Name", type: "text" },
        { key: "amount", label: "Amount", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "image", label: "Herb photo", type: "image" },
      ],
    },
    {
      key: "faq",
      label: "Product FAQ",
      type: "objectlist",
      full: true,
      section: "Details",
      subfields: [
        { key: "question", label: "Question", type: "text" },
        { key: "answer", label: "Answer", type: "textarea" },
      ],
    },
    {
      key: "reviews",
      label: "Reviews",
      type: "objectlist",
      full: true,
      section: "Reviews",
      subfields: [
        { key: "id", label: "ID", type: "text" },
        { key: "author", label: "Author", type: "text" },
        { key: "avatar", label: "Profile photo", type: "image" },
        { key: "rating", label: "Rating", type: "number" },
        { key: "title", label: "Title", type: "text" },
        { key: "comment", label: "Comment", type: "textarea" },
        { key: "date", label: "Date", type: "text" },
        { key: "verified", label: "Verified", type: "checkbox" },
        { key: "helpful", label: "Helpful", type: "number" },
      ],
    },
    { key: "isBestSeller", label: "Best seller", type: "checkbox", section: "Flags & SEO" },
    { key: "isFeatured", label: "Featured", type: "checkbox", section: "Flags & SEO" },
    { key: "isNewArrival", label: "New arrival", type: "checkbox", section: "Flags & SEO" },
    ...seoFields(),
  ],
};

/* ----------------------------- Categories ---------------------------- */
const categories: ResourceConfig = {
  name: "categories",
  title: "Categories",
  seo: { titleKey: "name", descriptionKey: "description", contentKey: "longDescription", slugKey: "slug", imageKey: "image", urlPrefix: "/category/" },
  singular: "Category",
  icon: "layers",
  pkKey: "id",
  activeField: "featured",
  // Tabs filter by PUBLISHED state; the bulk buttons still act on "featured".
  // (These were previously both wired to `featured`, so the tabs said
  // Active/Inactive while actually filtering something else.)
  statusField: "active",
  statusOnLabel: "Active",
  statusOffLabel: "Inactive",
  cards: true,
  columns: [
    { key: "_img", label: "", render: categoryThumb },
    {
      key: "name",
      label: "Category",
      render: (r) => (
        <div>
          <div className="font-semibold text-ink">{String(r.name)}</div>
          <div className="text-xs text-muted">/{String(r.slug)}</div>
          {r.description ? (
            <div className="mt-1 line-clamp-2 text-xs text-muted">{String(r.description)}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: "liveProductCount",
      label: "Products",
      // "3 live" used to mean "3 products, counted live" - which read as though
      // only 3 were published. Spell the breakdown out instead.
      render: (r) => {
        const s = (r.stats ?? {}) as Record<string, number | null>;
        const total = Number(r.liveProductCount ?? r.productCount ?? 0);
        if (total === 0) return <span className="text-xs text-muted">No products yet</span>;
        const active = Number(s.activeProducts ?? total);
        const inactive = Math.max(0, total - active);
        const out = Number(s.outOfStock ?? 0);
        return (
          <div>
            <div className="whitespace-nowrap">
              <span className="font-semibold text-ink">{total}</span>
              <span className="text-xs text-muted"> {total === 1 ? "product" : "products"}</span>
            </div>
            {/* The card wraps details in a `truncate` cell, so opt back into wrapping. */}
            <div className="mt-0.5 whitespace-normal text-xs text-muted">
              <span className="text-emerald-700">{active} active</span>
              {inactive > 0 && <span> · {inactive} inactive</span>}
              {out > 0 && <span className="text-red-600"> · {out} out of stock</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: "_skus",
      label: "SKUs",
      render: (r) => {
        const prods = categoryProducts(r);
        if (prods.length === 0) return <span className="text-xs text-muted">-</span>;
        const withSku = prods.filter((p) => p.sku);
        const missing = prods.length - withSku.length;
        return (
          <div className="flex flex-wrap items-center gap-1 whitespace-normal">
            {withSku.map((p) => (
              <span
                key={p.id}
                title={p.name}
                className="rounded-md border border-line bg-soft px-1.5 py-0.5 font-mono text-xs tabular-nums text-ink"
              >
                {p.sku}
              </span>
            ))}
            {missing > 0 && (
              <span className="text-xs text-amber-700">
                {missing} without SKU
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "_price",
      label: "Price range",
      render: (r) => {
        const s = (r.stats ?? {}) as Record<string, number | null>;
        if (s.minPrice == null) return <span className="text-xs text-muted">-</span>;
        return (
          <span className="whitespace-nowrap text-ink">
            {money(s.minPrice)}
            {s.maxPrice != null && s.maxPrice !== s.minPrice ? ` - ${money(s.maxPrice)}` : ""}
          </span>
        );
      },
    },
    {
      key: "_stock",
      label: "Inventory",
      render: (r) => {
        const s = (r.stats ?? {}) as Record<string, number | null>;
        return <span className="tabular-nums text-ink">{Number(s.inventory ?? 0)}</span>;
      },
    },
    {
      key: "_sales",
      label: "Sales",
      // `stats.revenue` is only present for roles that can see orders, so this
      // cell disappears rather than leaking revenue to a content editor.
      render: (r) => {
        const s = (r.stats ?? {}) as Record<string, number | undefined>;
        if (s.revenue === undefined) return <span className="text-xs text-muted">-</span>;
        if (!s.revenue) return <span className="text-xs text-muted">No sales yet</span>;
        return (
          <div className="whitespace-nowrap">
            <div className="font-semibold text-ink">{money(s.revenue)}</div>
            <div className="text-xs text-muted">
              {s.unitsSold ?? 0} units · {s.orders ?? 0} orders
            </div>
          </div>
        );
      },
    },
    { key: "sortOrder", label: "Order", render: (r) => <span className="tabular-nums text-muted">{r.sortOrder == null ? "-" : String(r.sortOrder)}</span> },
    { key: "active", label: "Status", segmented: true, onLabel: "Active", offLabel: "Inactive" },
    { key: "featured", label: "On home", segmented: true, onLabel: "Yes", offLabel: "No" },
  ],
  fields: [
    { key: "id", label: "Category ID", type: "text", pk: true, required: true, section: "Basics", help: "e.g. cat-immunity" },
    { key: "name", label: "Name", type: "text", required: true, section: "Basics" },
    { key: "slug", label: "Slug", type: "text", required: true, section: "Basics" },
    { key: "emoji", label: "Emoji", type: "text", section: "Basics" },
    {
      key: "active",
      label: "Active (visible on the website)",
      type: "checkbox",
      section: "Basics",
      default: true,
      help: "Switch off to hide the category from menus, listings and the sitemap. Its products stay untouched.",
    },
    { key: "featured", label: "Featured on home page", type: "checkbox", section: "Basics" },
    {
      key: "sortOrder",
      label: "Sort order",
      type: "number",
      section: "Basics",
      help: "Lower numbers appear first on the website. Leave blank to sort by name.",
    },
    { key: "productCount", label: "Product count (fallback)", type: "number", section: "Basics", help: "Only a fallback - the panel and the live site both count products automatically." },
    { key: "description", label: "Short description", type: "text", full: true, section: "Content" },
    { key: "longDescription", label: "Long description", type: "textarea", full: true, section: "Content" },
    { key: "gradient", label: "Art gradient", type: "gradient", section: "Media" },
    { key: "image", label: "Image", type: "image", section: "Media" },
    ...seoFields(),
  ],
};

/* -------------------------------- Blog ------------------------------- */
const blog: ResourceConfig = {
  name: "blog",
  title: "Blog posts",
  seo: { titleKey: "title", descriptionKey: "excerpt", contentKey: "content", slugKey: "slug", imageKey: "image", urlPrefix: "/blog/" },
  singular: "Post",
  icon: "file-text",
  pkKey: "id",
  columns: [
    { key: "_img", label: "", render: emojiThumb },
    {
      key: "title",
      label: "Title",
      render: (r) => (
        <div>
          <div className="font-semibold text-ink line-clamp-1">{String(r.title)}</div>
          <div className="text-xs text-muted">/{String(r.slug)}</div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (r) => <Badge tone="violet">{String(r.category)}</Badge> },
    { key: "author", label: "Author" },
    { key: "date", label: "Date", render: (r) => <span className="whitespace-nowrap text-muted">{String(r.date)}</span> },
  ],
  fields: [
    { key: "id", label: "Post ID", type: "text", pk: true, required: true, section: "Basics", help: "e.g. b4" },
    { key: "title", label: "Title", type: "text", required: true, section: "Basics" },
    { key: "slug", label: "Slug", type: "text", required: true, section: "Basics" },
    { key: "category", label: "Category", type: "text", section: "Basics", placeholder: "Herbs" },
    { key: "author", label: "Author", type: "text", section: "Basics" },
    { key: "authorAvatar", label: "Author avatar (emoji)", type: "text", section: "Basics", help: "Used only when no author photo is set." },
    { key: "authorImage", label: "Author photo", type: "image", section: "Basics" },
    { key: "date", label: "Date", type: "text", placeholder: "2026-07-10", section: "Basics" },
    { key: "readTime", label: "Read time", type: "text", placeholder: "6 min read", section: "Basics" },
    { key: "excerpt", label: "Excerpt", type: "textarea", full: true, section: "Content" },
    { key: "content", label: "Article body", type: "richtext", full: true, section: "Content", help: "Use the toolbar — pick a style, then type. Headings start at H2 because the post title is already the page's H1. Press HTML to see the raw markup." },
    { key: "emoji", label: "Emoji", type: "text", section: "Media" },
    { key: "gradient", label: "Art gradient", type: "gradient", section: "Media" },
    { key: "image", label: "Cover image", type: "image", section: "Media" },
    { key: "tags", label: "Tags", type: "tags", full: true, section: "Media" },
    ...seoFields(),
  ],
};

/* ------------------------------- Coupons ----------------------------- */
const coupons: ResourceConfig = {
  name: "coupons",
  title: "Coupons",
  singular: "Coupon",
  icon: "ticket",
  pkKey: "code",
  activeField: "active",
  columns: [
    { key: "code", label: "Code", render: (r) => <span className="rounded-xl bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-ink">{String(r.code)}</span> },
    { key: "type", label: "Type", render: (r) => <Badge tone={r.type === "percent" ? "violet" : "blue"}>{String(r.type)}</Badge> },
    { key: "value", label: "Value", render: (r) => <span className="font-semibold text-ink">{r.type === "percent" ? `${r.value}%` : money(r.value)}</span> },
    { key: "minOrder", label: "Min order", render: (r) => money(r.minOrder) },
    {
      key: "appliesTo",
      label: "Applies on",
      render: (r) => {
        const scope = String(r.appliesTo ?? "both");
        return (
          <Badge tone={scope === "prepaid" ? "green" : scope === "cod" ? "amber" : "neutral"}>
            {scope === "prepaid" ? "Prepaid only" : scope === "cod" ? "COD only" : "Prepaid + COD"}
          </Badge>
        );
      },
    },
    { key: "active", label: "Status", segmented: true },
  ],
  fields: [
    { key: "code", label: "Code", type: "text", pk: true, required: true, section: "Coupon", help: "Shown to customers, e.g. MEENA15" },
    {
      key: "type",
      label: "Type",
      type: "select",
      section: "Coupon",
      options: [
        { value: "percent", label: "Percent off (%)" },
        { value: "flat", label: "Flat amount off (₹)" },
      ],
    },
    { key: "value", label: "Value", type: "number", section: "Coupon", help: "Percentage or ₹ amount. Use 0 for a shipping-only coupon." },
    { key: "minOrder", label: "Minimum order (₹)", type: "number", section: "Coupon" },
    { key: "maxDiscount", label: "Max discount (₹)", type: "number", section: "Coupon", help: "Optional cap for percent coupons." },
    {
      key: "appliesTo",
      label: "Applies on",
      type: "select",
      section: "Coupon",
      default: "both",
      help: "Where the coupon works: only pay-online orders, only Cash on Delivery, or both.",
      options: [
        { value: "both", label: "Prepaid + COD (both)" },
        { value: "prepaid", label: "Prepaid only (pay online)" },
        { value: "cod", label: "COD only (Cash on Delivery)" },
      ],
    },
    { key: "description", label: "Description", type: "text", full: true, section: "Coupon" },
    { key: "active", label: "Active", type: "checkbox", section: "Coupon" },
  ],
};

/* ------------------------------- Banners ----------------------------- */
const banners: ResourceConfig = {
  name: "banners",
  title: "Hero banners",
  singular: "Banner",
  icon: "image",
  pkKey: "id",
  activeField: "active",
  columns: [
    { key: "_img", label: "", render: emojiThumb },
    {
      key: "title",
      label: "Title",
      render: (r) => (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-brand">{String(r.subtitle)}</div>
          <div className="font-semibold text-ink line-clamp-1">{String(r.title).replace(/\n/g, " ")}</div>
        </div>
      ),
    },
    { key: "buttonText", label: "CTA" },
    { key: "sortOrder", label: "Order" },
    { key: "active", label: "Status", segmented: true },
  ],
  fields: [
    { key: "id", label: "Banner ID", type: "text", pk: true, required: true, section: "Basics" },
    { key: "sortOrder", label: "Sort order", type: "number", section: "Basics" },
    { key: "active", label: "Active", type: "checkbox", section: "Basics" },
    { key: "subtitle", label: "Eyebrow", type: "text", section: "Text", placeholder: "Ancient wisdom" },
    { key: "title", label: "Title", type: "textarea", full: true, section: "Text", help: "Use line breaks for multi-line headlines." },
    { key: "description", label: "Description", type: "textarea", full: true, section: "Text" },
    { key: "buttonText", label: "Button text", type: "text", section: "Buttons" },
    { key: "buttonLink", label: "Button link", type: "text", section: "Buttons", placeholder: "/shop" },
    { key: "secondaryButtonText", label: "Secondary button text", type: "text", section: "Buttons" },
    { key: "secondaryButtonLink", label: "Secondary button link", type: "text", section: "Buttons" },
    { key: "emoji", label: "Emoji", type: "text", section: "Media" },
    { key: "image", label: "Image", type: "image", section: "Media" },
    { key: "mobileImage", label: "Mobile image", type: "image", section: "Media" },
    { key: "backgroundColor", label: "Background (CSS)", type: "text", full: true, section: "Media", placeholder: "linear-gradient(120deg,#eaf3ee,#dceee4)" },
    { key: "artBackground", label: "Art background (CSS)", type: "text", full: true, section: "Media" },
  ],
};

/* ---------------------------- Testimonials --------------------------- */
const testimonials: ResourceConfig = {
  name: "testimonials",
  title: "Testimonials",
  singular: "Testimonial",
  icon: "message",
  pkKey: "id",
  columns: [
    { key: "avatar", label: "", render: avatarThumb },
    { key: "name", label: "Name", render: (r) => <span className="font-semibold text-ink">{String(r.name)}</span> },
    { key: "rating", label: "Rating", render: (r) => <span className="text-gold">{"★".repeat(Number(r.rating) || 0)}<span className="text-slate-200">{"★".repeat(5 - (Number(r.rating) || 0))}</span></span> },
    { key: "location", label: "Location" },
    { key: "sortOrder", label: "Order" },
  ],
  fields: [
    { key: "id", label: "ID", type: "text", pk: true, required: true, section: "Testimonial" },
    { key: "name", label: "Name", type: "text", required: true, section: "Testimonial" },
    {
      key: "avatar",
      label: "Profile photo",
      type: "image",
      section: "Testimonial",
      help: "Upload a real photo (square works best). An emoji still works if you leave one here.",
    },
    { key: "role", label: "Role", type: "text", section: "Testimonial", placeholder: "Verified buyer" },
    { key: "rating", label: "Rating (1-5)", type: "number", section: "Testimonial" },
    { key: "location", label: "Location", type: "text", section: "Testimonial" },
    { key: "sortOrder", label: "Sort order", type: "number", section: "Testimonial" },
    { key: "quote", label: "Quote", type: "textarea", full: true, section: "Testimonial" },
  ],
};

/* --------------------------------- FAQ ------------------------------- */
const faqs: ResourceConfig = {
  name: "faqs",
  title: "FAQs",
  singular: "FAQ",
  icon: "help",
  pkKey: "id",
  columns: [
    { key: "id", label: "S.No", render: (r) => <span className="tabular-nums text-muted">{String(r.id)}</span> },
    { key: "question", label: "Question", render: (r) => <span className="font-medium text-ink line-clamp-1">{String(r.question)}</span> },
    { key: "category", label: "Category", render: (r) => <Badge>{String(r.category ?? "General")}</Badge> },
    { key: "sortOrder", label: "Order" },
  ],
  fields: [
    { key: "question", label: "Question", type: "textarea", full: true, required: true, section: "FAQ" },
    { key: "answer", label: "Answer", type: "textarea", full: true, required: true, section: "FAQ" },
    { key: "category", label: "Category", type: "text", section: "FAQ", default: "General" },
    { key: "sortOrder", label: "Sort order", type: "number", section: "FAQ" },
  ],
};

/* ------------------------------- Orders ------------------------------ */
const orders: ResourceConfig = {
  name: "orders",
  title: "Orders",
  singular: "Order",
  icon: "shopping-bag",
  pkKey: "id",
  columns: [
    {
      key: "orderNumber",
      label: "Order #",
      render: (r) => (
        <div>
          <div className="font-mono text-xs font-semibold text-ink">{String(r.orderNumber ?? r.id)}</div>
          <div className="whitespace-nowrap text-[11px] text-muted">{String(r.createdAt ?? "").slice(0, 10)}</div>
        </div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{String(r.customerName)}</div>
          <div className="text-xs text-muted">{String(r.customerMobile ?? "")}</div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (r) => {
        const items = Array.isArray(r.items) ? (r.items as Record<string, unknown>[]) : [];
        if (!items.length) return <span className="text-muted"> - </span>;
        return (
          <div className="max-w-[220px] space-y-0.5">
            {items.slice(0, 3).map((it, i) => (
              <div key={i} className="truncate text-xs text-ink">
                <span className="font-medium">{String(it.name ?? it.slug ?? "?")}</span>
                <span className="text-muted"> ×{String(it.quantity ?? 1)}</span>
                {it.variant ? <span className="text-muted"> · {String(it.variant)}</span> : null}
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-[11px] text-muted">+{items.length - 3} more…</div>
            )}
          </div>
        );
      },
    },
    {
      key: "total",
      label: "Total",
      render: (r) => (
        <div className="whitespace-nowrap">
          <div className="font-semibold text-ink">{money(r.total)}</div>
          {r.couponCode ? <Badge tone="violet">{String(r.couponCode)}</Badge> : null}
        </div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment",
      render: (r) => (
        <div className="space-y-1">
          <Badge>{String(r.paymentMethod ?? "cod").toUpperCase()}</Badge>
          {r.easyecomSynced ? (
            <Badge tone="green">EasyEcom ✓</Badge>
          ) : r.easyecomError ? (
            <Badge tone="red">failed</Badge>
          ) : (
            <Badge tone="amber">queued</Badge>
          )}
          {r.whatsappSentAt ? <Badge tone="green">WhatsApp ✓</Badge> : null}
        </div>
      ),
    },
    { key: "status", label: "Status", selectOptions: ORDER_STATUS_OPTIONS },
  ],
  fields: [
    { key: "orderNumber", label: "Order number", type: "text", section: "Order", placeholder: "MZ-1001" },
    { key: "status", label: "Status", type: "select", section: "Order", options: ORDER_STATUS_OPTIONS },
    { key: "paymentMethod", label: "Payment method", type: "select", section: "Order", options: [
      { value: "cod", label: "Cash on delivery" },
      { value: "razorpay", label: "Razorpay" },
      { value: "upi", label: "UPI" },
    ] },
    { key: "source", label: "Source", type: "text", section: "Order" },
    {
      key: "prepaidDiscount",
      label: "Prepaid discount (₹)",
      type: "number",
      section: "Order",
      readOnly: true,
      help: "Instant discount the customer earned by paying online (0 for COD). Already deducted from the total.",
    },
    {
      key: "amountPaid",
      label: "Amount already paid (₹)",
      type: "number",
      section: "Order",
      help: "0 or blank = full COD · equal to the total = fully prepaid · in between = partial payment (balance collected on delivery).",
    },
    { key: "easyecomSynced", label: "Pushed to EasyEcom", type: "checkbox", section: "EasyEcom", readOnly: true, help: "Set by the system on a successful push - cannot be edited by hand (use the Push-now button instead)." },
    { key: "dispatchAt", label: "Dispatch due at", type: "text", section: "EasyEcom", readOnly: true, help: "When the order becomes due to be pushed (placed time + hold window)." },
    { key: "easyecomPushedAt", label: "Pushed at", type: "text", section: "EasyEcom", readOnly: true, help: "Timestamp of the successful push to EasyEcom." },
    { key: "easyecomAttempts", label: "Push attempts", type: "number", section: "EasyEcom", readOnly: true },
    { key: "easyecomRef", label: "EasyEcom reference", type: "text", section: "EasyEcom", readOnly: true, help: "EasyEcom's order reference returned on a successful push." },
    { key: "easyecomError", label: "Last error", type: "textarea", full: true, section: "EasyEcom", readOnly: true, help: "Why the last push failed (blank once it succeeds)." },
    {
      key: "easyecomLog",
      label: "Dispatch history",
      type: "objectlist",
      full: true,
      section: "EasyEcom",
      help: "Every push attempt for this order - when it ran and whether it succeeded.",
      subfields: [
        { key: "at", label: "When", type: "text" },
        { key: "ok", label: "Success", type: "checkbox" },
        { key: "ref", label: "Reference", type: "text" },
        { key: "error", label: "Error", type: "textarea" },
      ],
    },
    { key: "fulfillmentStatus", label: "Courier status", type: "text", section: "Shipment", help: "Latest status text from EasyEcom/courier (set by the status webhook)." },
    { key: "shipmentStatusAt", label: "Status updated at", type: "text", section: "Shipment" },
    { key: "courier", label: "Courier", type: "text", section: "Shipment" },
    { key: "trackingNumber", label: "Tracking / AWB", type: "text", section: "Shipment" },
    { key: "trackingUrl", label: "Tracking URL", type: "text", full: true, section: "Shipment" },
    { key: "ndrReason", label: "NDR / return reason", type: "textarea", full: true, section: "Shipment" },
    { key: "easyecomOrderId", label: "EasyEcom order id", type: "text", section: "Shipment" },
    {
      key: "statusHistory",
      label: "Status history",
      type: "objectlist",
      full: true,
      section: "Shipment",
      help: "Timeline of every status update received from EasyEcom for this order.",
      subfields: [
        { key: "at", label: "When", type: "text" },
        { key: "status", label: "Status", type: "text" },
        { key: "note", label: "Note", type: "text" },
      ],
    },
    {
      key: "whatsappSentAt",
      label: "Confirmation sent at",
      type: "text",
      section: "WhatsApp",
      readOnly: true,
      help: "When the order-confirmation WhatsApp went out. Blank = not sent yet (use the Resend button above).",
    },
    {
      key: "whatsappLog",
      label: "Message attempts",
      type: "objectlist",
      full: true,
      section: "WhatsApp",
      help: "Every confirmation attempt - when it ran, which number it went to and why it failed.",
      subfields: [
        { key: "at", label: "When", type: "text" },
        { key: "ok", label: "Sent", type: "checkbox" },
        { key: "to", label: "To", type: "text" },
        { key: "campaign", label: "Campaign", type: "text" },
        { key: "error", label: "Error", type: "textarea" },
      ],
    },
    { key: "customerName", label: "Customer name", type: "text", required: true, section: "Customer" },
    { key: "customerMobile", label: "Account mobile (login)", type: "text", section: "Customer" },
    {
      key: "shippingPhone",
      label: "Delivery contact",
      type: "text",
      section: "Customer",
      help: "Number the customer entered for delivery - this is what the courier calls.",
    },
    { key: "customerEmail", label: "Email", type: "text", section: "Customer" },
    { key: "address", label: "Address", type: "textarea", full: true, section: "Customer" },
    { key: "city", label: "City", type: "text", section: "Customer" },
    { key: "state", label: "State", type: "text", section: "Customer" },
    { key: "pincode", label: "Pincode", type: "text", section: "Customer" },
    {
      key: "items",
      label: "Items",
      type: "objectlist",
      full: true,
      section: "Items",
      subfields: [
        { key: "name", label: "Product", type: "text" },
        { key: "sku", label: "SKU", type: "text" },
        { key: "variant", label: "Variety / pack", type: "text" },
        { key: "quantity", label: "Qty", type: "number" },
        { key: "price", label: "Unit price (₹)", type: "number" },
        { key: "lineTotal", label: "Line total (₹)", type: "number" },
      ],
    },
    { key: "subtotal", label: "Subtotal (₹)", type: "number", section: "Totals" },
    { key: "discount", label: "Discount (₹)", type: "number", section: "Totals" },
    { key: "shipping", label: "Shipping (₹)", type: "number", section: "Totals" },
    { key: "total", label: "Total (₹)", type: "number", section: "Totals" },
    { key: "couponCode", label: "Coupon code", type: "text", section: "Totals" },
    { key: "notes", label: "Internal notes", type: "textarea", full: true, section: "Totals" },
  ],
};

/* ------------------------------- Users ------------------------------- */
const users: ResourceConfig = {
  name: "users",
  title: "Admin users",
  singular: "User",
  icon: "users",
  pkKey: "id",
  activeField: "active",
  columns: [
    { key: "name", label: "Name", render: (r) => <span className="font-semibold text-ink">{String(r.name)}</span> },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => <Badge tone={r.role === "admin" ? "green" : "neutral"}>{String(r.role)}</Badge> },
    {
      key: "password",
      label: "Password",
      // A blank plaintext means the row predates the column (seeded admins) -
      // say so, instead of a bare dash that reads like "no password".
      render: (r) =>
        r.password ? (
          <code className="rounded bg-soft px-1.5 py-0.5 text-xs text-ink">{String(r.password)}</code>
        ) : (
          <span className="text-xs text-muted">Not shown - edit to set a new one</span>
        ),
    },
    { key: "lastLogin", label: "Last login", render: (r) => <span className="whitespace-nowrap text-xs text-muted">{String(r.lastLogin ?? " - ").slice(0, 16).replace("T", " ")}</span> },
    { key: "active", label: "Active", toggle: true },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true, section: "User" },
    { key: "email", label: "Email", type: "text", required: true, section: "User" },
    {
      key: "role",
      label: "Role",
      type: "select",
      section: "User",
      options: ROLE_OPTIONS,
      help: "Controls which panel sections this user can access. SEO / Content = blog & FAQs only (no products, orders or pricing).",
    },
    { key: "active", label: "Active", type: "checkbox", section: "User" },
    {
      key: "password",
      label: "Password",
      type: "password",
      full: true,
      section: "Security",
      help: "Minimum 6 characters. Press Show to read it. Stored in plaintext on purpose so you can look it up here. Leave blank to keep the current password.",
    },
  ],
};

export const RESOURCES: Record<string, ResourceConfig> = {
  products,
  categories,
  blog,
  coupons,
  banners,
  testimonials,
  faqs,
  orders,
  users,
};

export function getResource(name: string): ResourceConfig | undefined {
  return RESOURCES[name];
}

/* ------------------------------- Nav --------------------------------- */
export interface NavItem {
  href: string;
  label: string;
  icon: string;
}
export const NAV: NavItem[] = [
  { href: "/panel/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/panel/analytics", label: "Analytics", icon: "star" },
  { href: "/panel/products", label: "Products", icon: "box" },
  { href: "/panel/categories", label: "Categories", icon: "layers" },
  { href: "/panel/blog", label: "Blog", icon: "file-text" },
  { href: "/panel/orders", label: "Orders", icon: "shopping-bag" },
  { href: "/panel/customers", label: "Customers", icon: "users" },
  { href: "/panel/customers/otp", label: "OTP attempts", icon: "shield-check" },
  { href: "/panel/coupons", label: "Coupons", icon: "ticket" },
  { href: "/panel/banners", label: "Banners", icon: "image" },
  { href: "/panel/testimonials", label: "Testimonials", icon: "message" },
  { href: "/panel/faqs", label: "FAQs", icon: "help" },
  { href: "/panel/seo", label: "SEO settings", icon: "search" },
  { href: "/panel/settings", label: "Site settings", icon: "sliders" },
  { href: "/panel/users", label: "Admin users", icon: "users" },
  { href: "/panel/system", label: "System status", icon: "alert" },
];
