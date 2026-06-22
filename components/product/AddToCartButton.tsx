"use client";

import { useCartStore } from "@/lib/store/cartStore";
import { useToast } from "@/context/ToastContext";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

/** Add-to-cart action reused on cards and the product page. */
export function AddToCartButton({
  product,
  quantity = 1,
  variant = "primary",
  block,
  label = "Add to Cart",
  className,
}: {
  product: Product;
  quantity?: number;
  variant?: "primary" | "ghost" | "dark";
  block?: boolean;
  label?: string;
  className?: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToast();
  const outOfStock = product.stock <= 0;

  return (
    <Button
      variant={variant}
      block={block}
      className={className}
      disabled={outOfStock}
      onClick={() => {
        addItem(product, quantity);
        toast.success("Added to cart", `${product.name} ×${quantity}`);
      }}
    >
      {outOfStock ? "Out of Stock" : label}
    </Button>
  );
}

/** Compact "Add +" pill used on product cards. */
export function AddPill({ product, className }: { product: Product; className?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToast();
  const outOfStock = product.stock <= 0;
  return (
    <button
      type="button"
      className={cn("add", outOfStock && "opacity-50 cursor-not-allowed", className)}
      disabled={outOfStock}
      onClick={(e) => {
        e.preventDefault();
        addItem(product, 1);
        toast.success("Added to cart", product.name);
      }}
    >
      {outOfStock ? "Sold out" : "Add +"}
    </button>
  );
}
