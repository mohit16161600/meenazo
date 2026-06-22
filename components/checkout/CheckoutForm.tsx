"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderSummary } from "@/components/cart/OrderSummary";

import { AddressFields, emptyAddress, type AddressFormValue } from "./AddressFields";
import { PaymentMethods } from "./PaymentMethods";

import { useCartStore } from "@/lib/store/cartStore";
import { useCartSummary } from "@/hooks/useCart";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

import { orderService, generateOrderNumber } from "@/services/orderService";
import { submitCodOrder } from "@/services/codService";
import { formatPrice, formatDate } from "@/utils/format";
import type { Address, OrderItem, PaymentMethod } from "@/types";

/** Fields that must be filled before an order can be placed. */
const REQUIRED_KEYS: (keyof AddressFormValue)[] = [
  "fullName",
  "phone",
  "pincode",
  "line1",
  "city",
  "state",
  "country",
];

type FieldErrors = Partial<Record<keyof AddressFormValue, boolean>>;

function validate(addr: AddressFormValue): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of REQUIRED_KEYS) {
    if (!String(addr[key] ?? "").trim()) errors[key] = true;
  }
  if (addr.phone.trim().length !== 10) errors.phone = true;
  if (addr.pincode.trim().length !== 6) errors.pincode = true;
  return errors;
}

/** Build a full Address (with id) from the editable form value. */
function toAddress(value: AddressFormValue, id: string): Address {
  return { id, ...value };
}

/** Estimated delivery date: today + 5 days. */
function estimateDelivery(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString();
}

/** Compact in-card step heading (avoids the oversized global <h2>). */
function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-1.5 !text-xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useAuth();
  const toast = useToast();

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const clearCart = useCartStore((s) => s.clear);
  const summary = useCartSummary();

  const [shipping, setShipping] = useState<AddressFormValue>(() => ({
    ...emptyAddress,
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
  }));
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressFormValue>(emptyAddress);
  const [payment, setPayment] = useState<PaymentMethod>("cod");

  const [shippingErrors, setShippingErrors] = useState<FieldErrors>({});
  const [billingErrors, setBillingErrors] = useState<FieldErrors>({});
  const [placing, setPlacing] = useState(false);

  const itemCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);

  /* ---- Pre-hydration skeleton (cart comes from persisted store) ---- */
  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-brand" />
          <Skeleton className="h-40 w-full rounded-brand" />
        </div>
        <Skeleton className="h-80 w-full rounded-brand" />
      </div>
    );
  }

  /* ---- Empty cart ---- */
  if (items.length === 0) {
    return (
      <div className="card-surface">
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          message="Add a few Ayurvedic essentials to your cart before heading to checkout."
          actionLabel="Browse the shop"
          actionHref="/shop"
        />
      </div>
    );
  }

  async function placeOrder() {
    const sErrors = validate(shipping);
    const bErrors = billingSame ? {} : validate(billing);
    setShippingErrors(sErrors);
    setBillingErrors(bErrors);

    if (Object.keys(sErrors).length > 0 || Object.keys(bErrors).length > 0) {
      toast.error("Missing details", "Please fill in all required address fields.");
      return;
    }

    setPlacing(true);
    try {
      // Cash on Delivery → record the order in the CRM (one row per product).
      if (payment === "cod") {
        const codAddress = [
          shipping.line1,
          shipping.line2,
          shipping.city,
          `${shipping.state} - ${shipping.pincode}`,
        ]
          .filter(Boolean)
          .join(", ");

        try {
          const codRes = await submitCodOrder({
            name: shipping.fullName,
            mobile: shipping.phone,
            address: codAddress,
            state: shipping.state,
            items: items.map((i) => ({ product: i.slug, quantity: i.quantity })),
          });
          if (!codRes.success) {
            toast.error("Could not place COD order", codRes.message);
            setPlacing(false);
            return;
          }
        } catch {
          toast.error(
            "Could not reach the order server",
            "Please check your connection and try again."
          );
          setPlacing(false);
          return;
        }
      }

      const orderItems: OrderItem[] = items.map((i) => ({
        productId: i.productId,
        name: i.name,
        slug: i.slug,
        emoji: i.emoji,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit,
      }));

      const shippingAddress = toAddress(shipping, "ship-" + Math.random().toString(36).slice(2, 9));
      const billingAddress = billingSame
        ? shippingAddress
        : toAddress(billing, "bill-" + Math.random().toString(36).slice(2, 9));

      const created = await orderService.create({
        orderNumber: generateOrderNumber(),
        userId: user?.id,
        items: orderItems,
        subtotal: summary.subtotal,
        discount: summary.discount,
        shipping: summary.shipping,
        total: summary.total,
        couponCode: coupon?.code,
        paymentMethod: payment,
        status: "confirmed",
        shippingAddress,
        billingAddress,
        estimatedDelivery: estimateDelivery(),
      });

      clearCart();
      toast.success("Order placed!", `Your order ${created.orderNumber} is confirmed. 🌿`);
      router.push(`/checkout/success?order=${encodeURIComponent(created.orderNumber)}`);
    } catch {
      toast.error("Something went wrong", "We couldn't place your order. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* ============ Left: address + payment ============ */}
      <div className="space-y-8">
        {/* Shipping address */}
        <section className="card-surface p-5 sm:p-7">
          <StepHeader
            eyebrow="Step 1"
            title="Shipping address"
            subtitle="Where should we deliver your order?"
          />
          <AddressFields
            idPrefix="ship"
            value={shipping}
            onChange={setShipping}
            errors={shippingErrors}
          />
        </section>

        {/* Billing */}
        <section className="card-surface p-5 sm:p-7">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={billingSame}
              onChange={(e) => setBillingSame(e.target.checked)}
              className="mt-1 h-4 w-4 accent-brand"
            />
            <span>
              <span className="font-bold text-ink">Billing address same as shipping</span>
              <span className="mt-0.5 block text-sm text-muted">
                Uncheck to enter a different billing address.
              </span>
            </span>
          </label>

          {!billingSame && (
            <div className="mt-6 animate-fadeIn border-t border-line pt-6">
              <StepHeader eyebrow="Billing" title="Billing address" />
              <AddressFields
                idPrefix="bill"
                value={billing}
                onChange={setBilling}
                errors={billingErrors}
              />
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="card-surface p-5 sm:p-7">
          <StepHeader
            eyebrow="Step 2"
            title="Payment method"
            subtitle="Choose how you'd like to pay."
          />
          <PaymentMethods value={payment} onChange={setPayment} />
        </section>
      </div>

      {/* ============ Right: order summary ============ */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="card-surface p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-bold">
            Your items{" "}
            <span className="text-sm font-medium text-muted">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </h3>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <ArtPlaceholder
                  emoji={item.emoji}
                  gradient={item.gradient}
                  src={item.image}
                  alt={item.name}
                  fontSize={24}
                  className="h-12 w-12 flex-none rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.unit ? `${item.unit} · ` : ""}Qty {item.quantity}
                  </p>
                </div>
                <span className="flex-none text-sm font-bold tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <OrderSummary showCoupon />

        <Button block size="lg" onClick={placeOrder} disabled={placing}>
          {placing ? "Placing order…" : `Place order · ${formatPrice(summary.total)}`}
        </Button>

        <p className="text-center text-xs text-muted">
          Estimated delivery by {formatDate(estimateDelivery())}. By placing your order you agree to
          Meenazo&apos;s terms &amp; refund policy.
        </p>
      </aside>
    </div>
  );
}
