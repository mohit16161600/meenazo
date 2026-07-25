import type { FieldSpec } from "../_components/fields";
import { Badge } from "../_components/ui";
import { ROLE_OPTIONS } from "@/lib/panelRoles";

export interface Column {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
  /** Render an inline active/inactive switch bound to this boolean field. */
  toggle?: boolean;
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
  columns: Column[];
  fields: FieldSpec[];
  hideCreate?: boolean;
}

/* ------------------------------ helpers ------------------------------ */
const money = (v: unknown) => (v == null || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN")}`);
const emojiThumb = (row: Record<string, unknown>) => {
  const img = Array.isArray(row.images) ? (row.images as string[])[0] : (row.image as string);
  if (img)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img} alt="" className="h-9 w-9 rounded-lg border border-line object-cover" />;
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-lg">
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
  singular: "Product",
  icon: "box",
  pkKey: "id",
  activeField: "isFeatured",
  columns: [
    { key: "_img", label: "", render: emojiThumb },
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
    {
      key: "stock",
      label: "Stock",
      render: (r) =>
        Number(r.stock) <= 10 ? (
          <Badge tone="red">{String(r.stock)} left</Badge>
        ) : (
          <span className="text-ink">{String(r.stock)}</span>
        ),
    },
    { key: "isFeatured", label: "Featured", toggle: true },
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
    { key: "stock", label: "Stock", type: "number", section: "Pricing & stock" },
    { key: "dosage", label: "Dosage", type: "text", placeholder: "2 capsules per day", section: "Pricing & stock" },
    { key: "rating", label: "Rating", type: "number", step: 0.1, section: "Pricing & stock" },
    { key: "reviewCount", label: "Review count", type: "number", section: "Pricing & stock" },
    { key: "shortDescription", label: "Short description", type: "textarea", full: true, section: "Content" },
    { key: "description", label: "Full description", type: "textarea", full: true, section: "Content" },
    { key: "howToUse", label: "How to use", type: "textarea", full: true, section: "Content" },
    { key: "emoji", label: "Emoji", type: "text", placeholder: "⚖️", section: "Media" },
    { key: "gradient", label: "Art gradient", type: "gradient", section: "Media" },
    { key: "images", label: "Image URLs", type: "stringlist", full: true, section: "Media", placeholder: "/images/Slimpax.jpg" },
    { key: "video", label: "Video URL", type: "text", full: true, section: "Media" },
    { key: "benefits", label: "Benefits", type: "stringlist", full: true, section: "Details" },
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
        { key: "label", label: "Label", type: "text", placeholder: "Pack of 2 — 120 capsules" },
        { key: "unit", label: "Unit", type: "text", placeholder: "120 capsules" },
        { key: "price", label: "MRP (₹)", type: "number" },
        { key: "salePrice", label: "Sale price (₹)", type: "number" },
        { key: "sku", label: "EasyEcom SKU", type: "text", placeholder: "Optional — defaults to product SKU" },
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
        { key: "avatar", label: "Avatar (emoji)", type: "text" },
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
    { key: "seoTitle", label: "SEO title", type: "text", full: true, section: "Flags & SEO" },
    { key: "seoDescription", label: "SEO description", type: "textarea", full: true, section: "Flags & SEO" },
  ],
};

/* ----------------------------- Categories ---------------------------- */
const categories: ResourceConfig = {
  name: "categories",
  title: "Categories",
  singular: "Category",
  icon: "layers",
  pkKey: "id",
  activeField: "featured",
  columns: [
    { key: "_img", label: "", render: emojiThumb },
    { key: "name", label: "Name", render: (r) => <span className="font-semibold text-ink">{String(r.name)}</span> },
    { key: "slug", label: "Slug", render: (r) => <span className="text-muted">/{String(r.slug)}</span> },
    { key: "productCount", label: "Products" },
    { key: "featured", label: "Featured", toggle: true },
  ],
  fields: [
    { key: "id", label: "Category ID", type: "text", pk: true, required: true, section: "Basics", help: "e.g. cat-immunity" },
    { key: "name", label: "Name", type: "text", required: true, section: "Basics" },
    { key: "slug", label: "Slug", type: "text", required: true, section: "Basics" },
    { key: "emoji", label: "Emoji", type: "text", section: "Basics" },
    { key: "featured", label: "Featured on home", type: "checkbox", section: "Basics" },
    { key: "productCount", label: "Product count", type: "number", section: "Basics", help: "The live site recomputes this automatically." },
    { key: "description", label: "Short description", type: "text", full: true, section: "Content" },
    { key: "longDescription", label: "Long description", type: "textarea", full: true, section: "Content" },
    { key: "gradient", label: "Art gradient", type: "gradient", section: "Media" },
    { key: "image", label: "Image", type: "image", section: "Media" },
  ],
};

/* -------------------------------- Blog ------------------------------- */
const blog: ResourceConfig = {
  name: "blog",
  title: "Blog posts",
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
    { key: "authorAvatar", label: "Author avatar (emoji)", type: "text", section: "Basics" },
    { key: "date", label: "Date", type: "text", placeholder: "2026-07-10", section: "Basics" },
    { key: "readTime", label: "Read time", type: "text", placeholder: "6 min read", section: "Basics" },
    { key: "excerpt", label: "Excerpt", type: "textarea", full: true, section: "Content" },
    { key: "content", label: "Body (HTML)", type: "richtext", full: true, section: "Content", help: "Simple HTML: p, h2, h3, ul/ol, blockquote, strong, a." },
    { key: "emoji", label: "Emoji", type: "text", section: "Media" },
    { key: "gradient", label: "Art gradient", type: "gradient", section: "Media" },
    { key: "image", label: "Cover image", type: "image", section: "Media" },
    { key: "tags", label: "Tags", type: "tags", full: true, section: "Media" },
    { key: "seoTitle", label: "SEO title", type: "text", full: true, section: "SEO" },
    { key: "seoDescription", label: "SEO description", type: "textarea", full: true, section: "SEO" },
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
    { key: "code", label: "Code", render: (r) => <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-ink">{String(r.code)}</span> },
    { key: "type", label: "Type", render: (r) => <Badge tone={r.type === "percent" ? "violet" : "blue"}>{String(r.type)}</Badge> },
    { key: "value", label: "Value", render: (r) => <span className="font-semibold text-ink">{r.type === "percent" ? `${r.value}%` : money(r.value)}</span> },
    { key: "minOrder", label: "Min order", render: (r) => money(r.minOrder) },
    { key: "active", label: "Status", toggle: true },
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
    { key: "active", label: "Status", toggle: true },
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
    { key: "avatar", label: "", render: (r) => <span className="text-2xl">{String(r.avatar ?? "🙂")}</span> },
    { key: "name", label: "Name", render: (r) => <span className="font-semibold text-ink">{String(r.name)}</span> },
    { key: "rating", label: "Rating", render: (r) => <span className="text-gold">{"★".repeat(Number(r.rating) || 0)}<span className="text-slate-200">{"★".repeat(5 - (Number(r.rating) || 0))}</span></span> },
    { key: "location", label: "Location" },
    { key: "sortOrder", label: "Order" },
  ],
  fields: [
    { key: "id", label: "ID", type: "text", pk: true, required: true, section: "Testimonial" },
    { key: "name", label: "Name", type: "text", required: true, section: "Testimonial" },
    { key: "avatar", label: "Avatar (emoji)", type: "text", section: "Testimonial" },
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
        if (!items.length) return <span className="text-muted">—</span>;
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
    { key: "easyecomSynced", label: "Pushed to EasyEcom", type: "checkbox", section: "EasyEcom", help: "Ticked once the order has been sent to EasyEcom for fulfillment." },
    { key: "dispatchAt", label: "Dispatch due at", type: "text", section: "EasyEcom", help: "When the order becomes due to be pushed (placed time + hold window)." },
    { key: "easyecomPushedAt", label: "Pushed at", type: "text", section: "EasyEcom", help: "Timestamp of the successful push to EasyEcom." },
    { key: "easyecomAttempts", label: "Push attempts", type: "number", section: "EasyEcom" },
    { key: "easyecomRef", label: "EasyEcom reference", type: "text", section: "EasyEcom", help: "EasyEcom's order reference returned on a successful push." },
    { key: "easyecomError", label: "Last error", type: "textarea", full: true, section: "EasyEcom", help: "Why the last push failed (blank once it succeeds)." },
    {
      key: "easyecomLog",
      label: "Dispatch history",
      type: "objectlist",
      full: true,
      section: "EasyEcom",
      help: "Every push attempt for this order — when it ran and whether it succeeded.",
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
    { key: "customerName", label: "Customer name", type: "text", required: true, section: "Customer" },
    { key: "customerMobile", label: "Mobile", type: "text", section: "Customer" },
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
    { key: "password", label: "Password", render: (r) => <code className="rounded bg-soft px-1.5 py-0.5 text-xs text-ink">{String(r.password ?? "—")}</code> },
    { key: "lastLogin", label: "Last login", render: (r) => <span className="whitespace-nowrap text-xs text-muted">{String(r.lastLogin ?? "—").slice(0, 16).replace("T", " ")}</span> },
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
    { key: "password", label: "Password", type: "password", full: true, section: "Security", help: "Min 6 characters. Stored in plaintext so it stays viewable here. On edit, leave blank to keep the current password." },
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
  { href: "/panel/products", label: "Products", icon: "box" },
  { href: "/panel/categories", label: "Categories", icon: "layers" },
  { href: "/panel/blog", label: "Blog", icon: "file-text" },
  { href: "/panel/orders", label: "Orders", icon: "shopping-bag" },
  { href: "/panel/customers", label: "Customers", icon: "users" },
  { href: "/panel/coupons", label: "Coupons", icon: "ticket" },
  { href: "/panel/banners", label: "Banners", icon: "image" },
  { href: "/panel/testimonials", label: "Testimonials", icon: "message" },
  { href: "/panel/faqs", label: "FAQs", icon: "help" },
  { href: "/panel/settings", label: "Site settings", icon: "sliders" },
  { href: "/panel/users", label: "Admin users", icon: "users" },
];
