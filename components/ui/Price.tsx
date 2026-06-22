import { cn } from "@/utils/cn";
import { formatPrice, discountPercent } from "@/utils/format";

/** Price block with optional struck-through original + discount badge. */
export function Price({
  price,
  salePrice,
  className,
  showDiscount = false,
}: {
  price: number;
  salePrice?: number | null;
  className?: string;
  showDiscount?: boolean;
}) {
  const onSale = salePrice != null && salePrice < price;
  const pct = discountPercent(price, salePrice);
  return (
    <span className={cn("price inline-flex items-center gap-2", className)}>
      <span>{formatPrice(onSale ? (salePrice as number) : price)}</span>
      {onSale && <s>{formatPrice(price)}</s>}
      {onSale && showDiscount && <span className="chip chip-red !text-[10px]">{pct}% OFF</span>}
    </span>
  );
}
