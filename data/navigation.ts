import type { NavItem, FooterColumn } from "@/types";
import { categories } from "./categories";
import { bestSellers } from "./products";

const heroProduct = bestSellers[0];

/** Primary header navigation with a Shop mega menu built from categories. */
export const navItems: NavItem[] = [
  {
    label: "Shop",
    href: "/shop",
    megaMenu: {
      columns: [
        {
          heading: "Health Concerns",
          links: categories.slice(0, 4).map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
        },
        {
          heading: "More Categories",
          links: categories.slice(4).map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
        },
        {
          heading: "Collections",
          links: [
            { label: "Best Sellers", href: "/shop?sort=rating" },
            { label: "New Arrivals", href: "/shop?sort=newest" },
            { label: "On Sale", href: "/shop?tag=sale" },
            { label: "All Products", href: "/shop" },
          ],
        },
      ],
      featured: heroProduct
        ? {
            title: heroProduct.name,
            description: heroProduct.shortDescription,
            emoji: heroProduct.emoji,
            href: `/product/${heroProduct.slug}`,
            buttonText: "Shop now",
          }
        : undefined,
    },
  },
  {
    label: "Categories",
    href: "/shop",
    dropdown: categories.map((c) => ({ label: `${c.emoji}  ${c.name}`, href: `/category/${c.slug}` })),
  },
  { label: "Best Sellers", href: "/shop?sort=rating" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerColumns: FooterColumn[] = [
  {
    heading: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Diabetes Care", href: "/category/diabetes" },
      { label: "Weight Loss", href: "/category/weight-loss" },
      { label: "Men's Health", href: "/category/mens-health" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact Us", href: "/contact" },
      { label: "Certifications", href: "/about#certifications" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Return Policy", href: "/return-policy" },
      { label: "Track Order", href: "/account/orders" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Return Policy", href: "/return-policy" },
    ],
  },
];
