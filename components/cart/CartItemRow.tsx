"use client";

import Link from "next/link";
import type { CartItem } from "@/types";
import { useCartStore } from "@/lib/store/cartStore";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/utils/format";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Icon } from "@/components/ui/Icon";

/** A single line item inside the cart: art, name, unit price, qty, subtotal, remove. */
export function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const toast = useToast();

  const lineTotal = item.price * item.quantity;
  const maxQty = Math.max(1, item.stock);

  const remove = () => {
    removeItem(item.productId);
    toast.info("Removed from cart", `${item.name} was removed from your cart.`);
  };

  return (
    <div className="flex gap-4 py-5">
      {/* Thumb */}
      <Link
        href={`/product/${item.slug}`}
        className="shrink-0"
        aria-label={`View ${item.name}`}
      >
        <ArtPlaceholder
          emoji={item.emoji}
          gradient={item.gradient}
          src={item.image}
          alt={item.name}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-brand"
          fontSize={40}
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/product/${item.slug}`}
              className="font-bold text-ink hover:text-brand transition-colors line-clamp-2"
            >
              {item.name}
            </Link>
            {item.unit && <p className="text-xs text-muted mt-0.5">{item.unit}</p>}
            <p className="text-sm text-muted mt-1 tabular-nums">{formatPrice(item.price)} each</p>
          </div>

          <button
            type="button"
            onClick={remove}
            aria-label={`Remove ${item.name} from cart`}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-soft hover:text-red-600 transition-colors"
          >
            <Icon name="trash" size={18} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <QuantitySelector
            value={item.quantity}
            onChange={(next) => updateQuantity(item.productId, next)}
            min={1}
            max={maxQty}
          />
          <span className="font-extrabold tabular-nums">{formatPrice(lineTotal)}</span>
        </div>

        {item.quantity >= item.stock && (
          <p className="text-xs text-gold mt-2">Max available quantity reached</p>
        )}
      </div>
    </div>
  );
}
