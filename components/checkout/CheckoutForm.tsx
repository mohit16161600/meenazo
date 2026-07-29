"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
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
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  loadRazorpayScript,
  openRazorpayCheckout,
  isRazorpayEnabled,
  type RazorpayLineItem,
} from "@/services/razorpayService";
import { pushCartToServer } from "@/lib/customerSync";
import { siteConfig } from "@/data/site";
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

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const clearCart = useCartStore((s) => s.clear);
  const summary = useCartSummary();

  // Save the cart to the DB on reaching checkout so an un-completed order shows
  // up as an "abandoned cart" in the panel (keyed by the customer's number).
  useEffect(() => {
    if (isAuthenticated && items.length) void pushCartToServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const onlineEnabled = isRazorpayEnabled();

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailError, setEmailError] = useState(false);
  const [shipping, setShipping] = useState<AddressFormValue>(() => ({
    ...emptyAddress,
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
  }));
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressFormValue>(emptyAddress);
  const [payment, setPayment] = useState<PaymentMethod>(onlineEnabled ? "razorpay" : "cod");

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

  /* ---- Login required (order only after sign-in) ---- */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md card-surface p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint text-2xl">🔒</div>
        <h2 className="mt-4 !text-xl">Please sign in to check out</h2>
        <p className="mt-2 text-sm text-muted">
          For your security we verify your mobile number before placing an order. It only takes a few seconds.
        </p>
        <Link
          href="/login?redirect=/checkout"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Sign in with mobile OTP
        </Link>
        <p className="mt-3 text-xs text-muted">Your cart is saved — you&apos;ll come right back here.</p>
      </div>
    );
  }

  const addressString = () =>
    [shipping.line1, shipping.line2, shipping.city, `${shipping.state} - ${shipping.pincode}`]
      .filter(Boolean)
      .join(", ");

  const cartPayloadItems = (): RazorpayLineItem[] =>
    items.map((i) => ({ product: i.slug, quantity: i.quantity, variant: i.variant }));

  /**
   * Persist a local copy of the confirmed order and route to the success page.
   *
   * `serverOrderNumber` MUST be the number the server recorded (mpl0001, …).
   * The success page looks the order up through /api/customer/orders/[id],
   * which only knows server-issued ids — routing with a locally generated
   * number made every confirmation render "We couldn't find that order".
   */
  async function finalizeOrder(
    method: PaymentMethod,
    serverTotal?: number,
    serverOrderNumber?: string
  ) {
    const orderItems: OrderItem[] = items.map((i) => ({
      productId: i.productId,
      name: i.name,
      slug: i.slug,
      emoji: i.emoji,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
      unit: i.unit,
      variant: i.variant,
    }));

    const shippingAddress = toAddress(shipping, "ship-" + Math.random().toString(36).slice(2, 9));
    const billingAddress = billingSame
      ? shippingAddress
      : toAddress(billing, "bill-" + Math.random().toString(36).slice(2, 9));

    const created = await orderService.create({
      // Server-issued number wins; the local generator is only a last-resort
      // fallback for the (already error-handled) case where the API returned none.
      orderNumber: serverOrderNumber || generateOrderNumber(),
      userId: user?.id,
      items: orderItems,
      subtotal: summary.subtotal,
      discount: summary.discount,
      shipping: summary.shipping,
      // Prefer the server-computed total (what was actually charged/recorded).
      total: serverTotal ?? summary.total,
      couponCode: coupon?.code,
      paymentMethod: method,
      status: "confirmed",
      shippingAddress,
      billingAddress,
      estimatedDelivery: estimateDelivery(),
    });

    clearCart();
    toast.success("Order placed!", `Your order ${created.orderNumber} is confirmed. 🌿`);
    router.push(`/checkout/success?order=${encodeURIComponent(created.orderNumber)}`);
  }

  /** Cash on Delivery: record server-side (local DB + CRM), then finalize. */
  async function placeCodOrder() {
    let serverTotal: number | undefined;
    let serverOrderNumber: string | undefined;
    try {
      const codRes = await submitCodOrder({
        name: shipping.fullName,
        mobile: shipping.phone,
        email: email.trim() || undefined,
        address: addressString(),
        state: shipping.state,
        city: shipping.city,
        pincode: shipping.pincode,
        coupon: coupon?.code,
        paymentMethod: "cod",
        items: cartPayloadItems(),
      });
      if (!codRes.success) {
        toast.error("Could not place COD order", codRes.message);
        setPlacing(false);
        return;
      }
      serverTotal = codRes.total;
      serverOrderNumber = codRes.orderNumber;
    } catch {
      toast.error("Could not reach the order server", "Please check your connection and try again.");
      setPlacing(false);
      return;
    }
    // Order is recorded server-side — the local copy + navigation must not be
    // reported as an order-placement failure.
    await finalizeOrder("cod", serverTotal, serverOrderNumber);
  }

  /** Razorpay: create a server-priced order, open checkout, verify, then finalize. */
  async function placeRazorpayOrder() {
    let verifiedTotal: number | undefined;
    let serverOrderNumber: string | undefined;
    try {
      const orderRes = await createRazorpayOrder({
        name: shipping.fullName,
        mobile: shipping.phone,
        email: email.trim() || undefined,
        address: addressString(),
        city: shipping.city,
        state: shipping.state,
        pincode: shipping.pincode,
        coupon: coupon?.code,
        items: cartPayloadItems(),
      });

      if (!orderRes.success || !orderRes.razorpayOrderId || !orderRes.keyId) {
        toast.error(
          "Couldn't start online payment",
          orderRes.message ?? "Please try again or choose Cash on Delivery."
        );
        setPlacing(false);
        return;
      }

      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast.error("Payment unavailable", "Could not load the payment gateway. Please try Cash on Delivery.");
        setPlacing(false);
        return;
      }

      const result = await openRazorpayCheckout({
        keyId: orderRes.keyId,
        amount: orderRes.amount ?? Math.round((orderRes.total ?? summary.total) * 100),
        currency: orderRes.currency ?? "INR",
        razorpayOrderId: orderRes.razorpayOrderId,
        brand: siteConfig.name,
        description: `Order ${orderRes.orderNumber ?? ""}`.trim(),
        prefill: orderRes.prefill,
        themeColor: "#5b8c6e",
      });

      if (!result) {
        // User dismissed the modal — order stays pending server-side, nothing charged as confirmed.
        toast.info("Payment cancelled", "You can complete your payment any time.");
        setPlacing(false);
        return;
      }

      const verify = await verifyRazorpayPayment({
        internalOrderId: orderRes.internalOrderId ?? "",
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });

      if (!verify.success) {
        toast.error(
          "Payment could not be verified",
          verify.message ?? "If money was deducted it will be refunded. Please contact support."
        );
        setPlacing(false);
        return;
      }

      verifiedTotal = verify.total ?? orderRes.total;
      serverOrderNumber = verify.orderNumber ?? orderRes.orderNumber;
    } catch {
      toast.error("Payment failed", "Something went wrong during payment. Please try again.");
      setPlacing(false);
      return;
    }
    // Payment is verified & charged — persistence/navigation issues must NEVER
    // be reported as a payment failure or leave the cart populated for a retry.
    await finalizeOrder("razorpay", verifiedTotal, serverOrderNumber);
  }

  async function placeOrder() {
    const sErrors = validate(shipping);
    const bErrors = billingSame ? {} : validate(billing);
    const badEmail = email.trim() !== "" && !isEmail(email.trim());
    setShippingErrors(sErrors);
    setBillingErrors(bErrors);
    setEmailError(badEmail);

    if (Object.keys(sErrors).length > 0 || Object.keys(bErrors).length > 0 || badEmail) {
      toast.error("Check your details", "Please fix the highlighted fields before placing your order.");
      return;
    }

    setPlacing(true);
    if (payment === "razorpay") {
      await placeRazorpayOrder();
    } else {
      await placeCodOrder();
    }
  }

  const ctaLabel = placing
    ? payment === "razorpay"
      ? "Processing payment…"
      : "Placing order…"
    : payment === "razorpay"
      ? `Pay securely · ${formatPrice(summary.total)}`
      : `Place order · ${formatPrice(summary.total)}`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* ============ Left: contact + address + payment ============ */}
      <div className="space-y-8">
        {/* Contact */}
        <section className="card-surface p-5 sm:p-7">
          <StepHeader
            eyebrow="Step 1"
            title="Contact details"
            subtitle="We'll send your order confirmation and updates here."
          />
          <div>
            <label className="label" htmlFor="checkout-email">
              Email address <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              className={emailError ? "field border-red-400 focus:border-red-400" : "field"}
              placeholder="you@example.com"
              value={email}
              aria-invalid={emailError}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>}
          </div>
        </section>

        {/* Shipping address */}
        <section className="card-surface p-5 sm:p-7">
          <StepHeader
            eyebrow="Step 2"
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
            eyebrow="Step 3"
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
              <li key={`${item.productId}::${item.variant ?? ""}`} className="flex items-center gap-3">
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
                    {(item.variant ?? item.unit) ? `${item.variant ?? item.unit} · ` : ""}Qty {item.quantity}
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
          {ctaLabel}
        </Button>

        {/* Trust / security strip */}
        <div className="rounded-brand border border-line bg-white p-4">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-ink">
            <Icon name="shield-check" size={18} className="text-brand" />
            {payment === "razorpay" ? "Secured by Razorpay" : "Safe & secure checkout"}
          </div>
          <p className="mt-1.5 text-center text-xs text-muted">
            {payment === "razorpay"
              ? "You'll complete payment on Razorpay's encrypted page — UPI, cards, netbanking & wallets."
              : "Pay cash when your order is delivered. No advance payment needed."}
          </p>
        </div>

        <p className="text-center text-xs text-muted">
          Estimated delivery by {formatDate(estimateDelivery())}. By placing your order you agree to
          Meenazo&apos;s terms &amp; refund policy.
        </p>
      </aside>
    </div>
  );
}
