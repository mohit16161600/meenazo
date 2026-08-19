"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { CouponBox } from "@/components/cart/CouponBox";

import { AddressFields, emptyAddress, type AddressFormValue } from "./AddressFields";
import { PaymentMethods } from "./PaymentMethods";

import { useCartStore } from "@/lib/store/cartStore";
import { useCartSummary } from "@/hooks/useCart";
import { useServerQuote } from "@/hooks/useServerQuote";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

import { orderService, generateOrderNumber } from "@/services/orderService";
import { submitCodOrder, fetchCodEligibility, type CodEligibility } from "@/services/codService";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  loadRazorpayScript,
  openRazorpayCheckout,
  isRazorpayEnabled,
  type RazorpayLineItem,
  type RazorpayFailure,
  type RazorpayPreferredMethod,
} from "@/services/razorpayService";
import { pushCartToServer } from "@/lib/customerSync";
import { codAmountBlockedMessage, codDisabledMessage } from "@/lib/codRules";
import { isOnlinePaymentEnabled, onlinePaymentDisabledMessage } from "@/lib/pricing";
import { siteConfig } from "@/data/site";
import { formatPrice, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
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

/**
 * Estimated delivery date. The Shipping & Cancellation Policy promises 7–10
 * business days from dispatch, so we quote the far end of that window (14
 * calendar days ≈ 10 business days) rather than a date we may not hit.
 */
function estimateDelivery(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
}

/**
 * Numbered step card — the green circled number, title and subtitle that give
 * the page its "3 clear steps" rhythm.
 */
function Step({
  n,
  title,
  subtitle,
  done,
  children,
  className,
}: {
  n: number;
  title: string;
  subtitle?: string;
  done?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-surface p-5 sm:p-7", className)}>
      <div className="mb-5 flex items-start gap-3">
        <span
          className={cn(
            "grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-extrabold transition-colors",
            done ? "bg-brand text-white" : "bg-mint text-brand-dark ring-1 ring-brand/20"
          )}
          aria-hidden
        >
          {done ? <Icon name="check" size={16} /> : n}
        </span>
        <div className="min-w-0">
          <h2 className="!text-lg !leading-tight sm:!text-xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
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

  // Save the cart to the DB on reaching checkout so an un-completed order shows
  // up as an "abandoned cart" in the panel (keyed by the customer's number).
  useEffect(() => {
    if (isAuthenticated && items.length) void pushCartToServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Is paying online possible at all? Two independent gates: the gateway keys
  // must exist, and the owner must not have switched it off in the panel. This
  // is only the FIRST guess (published snapshot) — the server's live answer
  // arrives with the quote below and wins.
  const razorpayConfigured = isRazorpayEnabled();
  const onlineEnabledInitially = razorpayConfigured && isOnlinePaymentEnabled(siteConfig);

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailError, setEmailError] = useState(false);
  const [shipping, setShipping] = useState<AddressFormValue>(() => ({
    ...emptyAddress,
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
  }));
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressFormValue>(emptyAddress);
  const [payment, setPayment] = useState<PaymentMethod>(onlineEnabledInitially ? "razorpay" : "cod");
  const [preferred, setPreferred] = useState<RazorpayPreferredMethod | null>(null);

  const [shippingErrors, setShippingErrors] = useState<FieldErrors>({});
  const [billingErrors, setBillingErrors] = useState<FieldErrors>({});
  const [placing, setPlacing] = useState(false);
  const [codEligibility, setCodEligibility] = useState<CodEligibility | null>(null);

  // Totals follow the chosen method: picking "Pay online" applies the prepaid
  // discount to everything on screen.
  //
  // The LOCAL figure is only a placeholder. What is displayed — and what the
  // button commits to — is the server's own price for this cart, because the
  // published snapshot the browser prices from can be stale (an unpublished
  // panel edit, a deactivated coupon, a cart item added weeks ago at an old
  // price). Showing one number and charging another is the bug this closes.
  const localSummary = useCartSummary(payment);
  const { quote, loading: quoteLoading, error: quoteError } = useServerQuote(
    items,
    coupon?.code,
    payment
  );
  const summary = quote ? { ...localSummary, ...quote } : localSummary;
  // Only the very first answer blocks the button; later re-quotes don't.
  const awaitingFirstQuote = quoteLoading && !quote;

  /* ---- Is Cash on Delivery on offer for this order? ----
   * A switch and two rules, all re-checked by the server when the order is
   * submitted:
   *   • the owner's master switch — comes with the quote, live from the panel
   *   • the order value cap — known from the cart alone
   *   • one COD order per number per hour — only the server knows this, so we
   *     ask it (a failed/absent answer simply leaves COD on offer).
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    let live = true;
    void fetchCodEligibility().then((res) => {
      if (live && res) setCodEligibility(res);
    });
    return () => {
      live = false;
    };
  }, [isAuthenticated]);

  // The owner's master switches, live from the server quote (the local summary
  // only carries the published snapshot, which may be one Publish behind).
  const codSwitchedOn = summary.codEnabled !== false;
  const onlineAllowed = razorpayConfigured && summary.onlinePaymentEnabled !== false;

  const codCooldownOk = codEligibility?.allowed !== false;
  const codAllowed = codSwitchedOn && summary.codAmountAllowed && codCooldownOk;
  const codBlockedReason = !codSwitchedOn
    ? codDisabledMessage()
    : !summary.codAmountAllowed
      ? codAmountBlockedMessage(summary.codMaxOrderValue)
      : codCooldownOk
        ? null
        : codEligibility?.reason;

  // A method just became unavailable (the owner switched it off, the cart
  // crossed the COD cap, or the cooldown answer arrived) while it was the
  // selected one — move the customer to the option that can actually go through
  // instead of failing at the last click. When BOTH are off nothing is moved:
  // the CTA below refuses the order and says why.
  useEffect(() => {
    if (payment === "cod" && !codAllowed && onlineAllowed) setPayment("razorpay");
    else if (payment === "razorpay" && !onlineAllowed && codAllowed) setPayment("cod");
  }, [codAllowed, onlineAllowed, payment]);

  const itemCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const addressDone = Object.keys(validate(shipping)).length === 0;

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
   * `serverOrderNumber` MUST be the number the server recorded (MPL0001, …).
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
      prepaidDiscount: summary.prepaidDiscount,
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

  /** Cash on Delivery: record server-side, then finalize. */
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
        // A COD rule refused it (over the cap, or still inside the cooldown):
        // nothing was recorded. Reflect the server's verdict in the UI and put
        // the customer on the online option so the order can still go through.
        if (codRes.codBlocked) {
          if (codRes.codBlocked === "cooldown") {
            setCodEligibility((prev) => ({
              allowed: false,
              reason: codRes.message,
              retryAfterMinutes: Number(codRes.retryAfterMinutes ?? 0),
              maxOrderValue: prev?.maxOrderValue ?? summary.codMaxOrderValue,
              cooldownMinutes: prev?.cooldownMinutes ?? 0,
            }));
          }
          if (onlineAllowed) setPayment("razorpay");
          toast.error("COD not available", codRes.message);
        } else {
          toast.error("Could not place COD order", codRes.message);
        }
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
        // Switched off in the panel while this tab was open — put the customer
        // on COD rather than leaving them on a method that can't complete.
        if (orderRes.onlineBlocked && codAllowed) setPayment("cod");
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

      // A declined attempt doesn't close the modal (Razorpay offers a retry), so
      // remember the reason and only report it if the customer then gives up.
      let failure: RazorpayFailure | null = null;

      const result = await openRazorpayCheckout({
        keyId: orderRes.keyId,
        amount: orderRes.amount ?? Math.round((orderRes.total ?? summary.total) * 100),
        currency: orderRes.currency ?? "INR",
        razorpayOrderId: orderRes.razorpayOrderId,
        brand: siteConfig.name,
        description: `Order ${orderRes.orderNumber ?? ""}`.trim(),
        prefill: orderRes.prefill,
        preferredMethod: preferred,
        themeColor: "#5b8c6e",
        onFailed: (info) => {
          failure = info;
        },
      });

      if (!result) {
        const reason = (failure as RazorpayFailure | null)?.description;
        if (reason) {
          // Payment was actually attempted and declined — say why, and make it
          // clear nothing was charged.
          toast.error("Payment failed", `${reason} No money was deducted — please try again or choose Cash on Delivery.`);
        } else {
          // Simply dismissed — order stays pending server-side, nothing charged.
          toast.info("Payment cancelled", "You can complete your payment any time.");
        }
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
      // Take them straight to the first thing that needs fixing.
      document.getElementById("checkout-address")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Last line of defence in the browser (the server refuses it too).
    if (payment === "cod" && !codAllowed) {
      toast.error("COD not available", codBlockedReason ?? "Please pay online to place this order.");
      return;
    }
    if (payment === "razorpay" && !onlineAllowed) {
      toast.error("Online payment unavailable", onlinePaymentDisabledMessage());
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
    : awaitingFirstQuote
      ? "Checking prices…"
      : payment === "razorpay"
        ? `Pay securely · ${formatPrice(summary.total)}`
        : `Place order · ${formatPrice(summary.total)}`;
  // Only a shop with NO usable payment method kills the button outright; a
  // single blocked method still lets the click through so the customer gets the
  // reason in a toast (and is moved to the other option).
  const ctaDisabled = placing || awaitingFirstQuote || (!codAllowed && !onlineAllowed);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
        {/* ============ Left: contact + address + payment ============ */}
        <div className="space-y-6">
          {/* Step 1 — contact */}
          <Step
            n={1}
            title="Contact information"
            subtitle="Your order confirmation and delivery updates come here."
            done={Boolean(user?.phone)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="checkout-phone">
                  Mobile number
                </label>
                <div className="flex items-center gap-2 rounded-brand border border-line bg-soft px-4 py-3">
                  <Icon name="phone" size={16} className="flex-none text-brand" />
                  <span className="font-semibold text-ink">{user?.phone ?? "—"}</span>
                  <span className="chip chip-soft ml-auto inline-flex items-center gap-1">
                    <Icon name="badge-check" size={12} /> Verified
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  This is your signed-in number — orders are always placed against it.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="checkout-email">
                  Email address <span className="font-normal text-muted">(optional)</span>
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    className={cn("field !pl-11", emailError && "border-red-400 focus:border-red-400")}
                    placeholder="you@example.com"
                    value={email}
                    aria-invalid={emailError}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {emailError ? (
                  <p className="mt-1.5 text-xs text-red-600">Please enter a valid email address.</p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted">For your invoice and shipping updates.</p>
                )}
              </div>
            </div>
          </Step>

          {/* Step 2 — shipping address */}
          <div id="checkout-address">
            <Step
              n={2}
              title="Shipping address"
              subtitle="Where should we deliver your order?"
              done={addressDone}
            >
              <AddressFields
                idPrefix="ship"
                value={shipping}
                onChange={setShipping}
                errors={shippingErrors}
              />

              <label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-line pt-5">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={(e) => setBillingSame(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-brand"
                />
                <span>
                  <span className="font-semibold text-ink">Billing address same as shipping</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    Uncheck to enter a different billing address.
                  </span>
                </span>
              </label>

              {!billingSame && (
                <div className="mt-5 animate-fadeIn rounded-brand bg-soft p-4 sm:p-5">
                  <p className="mb-4 font-semibold text-ink">Billing address</p>
                  <AddressFields
                    idPrefix="bill"
                    value={billing}
                    onChange={setBilling}
                    errors={billingErrors}
                  />
                </div>
              )}
            </Step>
          </div>

          {/* Step 3 — payment */}
          <Step n={3} title="Payment method" subtitle="Choose how you'd like to pay for your order.">
            <PaymentMethods
              value={payment}
              onChange={setPayment}
              preferred={preferred}
              onPreferredChange={setPreferred}
              prepaidPercent={summary.prepaidPercent}
              prepaidSaving={summary.prepaidSaving}
              codAllowed={codAllowed}
              codBlockedReason={codBlockedReason}
              onlineAllowed={onlineAllowed}
              onlineBlockedReason={onlinePaymentDisabledMessage()}
            />

            {/* Both methods off — the shop can't take this order at all. Said
                here, plainly, rather than leaving two dead cards and a button
                that fails. */}
            {!codAllowed && !onlineAllowed && (
              <p className="mt-3 flex items-start gap-2 rounded-brand bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
                <Icon name="info" size={16} className="mt-0.5 flex-none" />
                We&apos;re not accepting orders right now. Please try again shortly or contact us on
                WhatsApp and we&apos;ll take your order.
              </p>
            )}
          </Step>

          {/* Reassurance strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: "truck", label: "India delivery", note: "7–10 business days" },
              { icon: "return", label: "5-day returns", note: "Wrong or damaged" },
              { icon: "leaf", label: "Ayurvedic", note: "Made in India" },
              { icon: "headset", label: "Expert Support", note: "Mon–Sat, 9–7" },
            ].map((t) => (
              <div key={t.label} className="rounded-brand border border-line bg-white p-3 text-center">
                <Icon name={t.icon} size={20} className="mx-auto text-brand" />
                <p className="mt-1.5 text-xs font-bold text-ink">{t.label}</p>
                <p className="text-[11px] text-muted">{t.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ============ Right: order summary ============ */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-line bg-soft/70 px-5 py-4">
              <h3 className="text-base font-bold text-ink">Order summary</h3>
              <span className="chip chip-soft">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <ul className="divide-y divide-line px-5">
              {items.map((item) => (
                <li key={`${item.productId}::${item.variant ?? ""}`} className="flex items-center gap-3 py-3.5">
                  <div className="relative flex-none">
                    <ArtPlaceholder
                      emoji={item.emoji}
                      gradient={item.gradient}
                      src={item.image}
                      alt={item.name}
                      fontSize={26}
                      className="h-14 w-14 rounded-xl ring-1 ring-line"
                    />
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{item.name}</p>
                    {(item.variant ?? item.unit) && (
                      <p className="mt-0.5 text-xs text-muted">{item.variant ?? item.unit}</p>
                    )}
                  </div>
                  <span className="flex-none text-sm font-bold tabular-nums text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 py-4">
              <CouponBox />
            </div>

            <dl className="space-y-2.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(summary.subtotal)}</dd>
              </div>

              {summary.discount > 0 && (
                <div className="flex items-center justify-between text-brand">
                  <dt className="flex items-center gap-1.5">
                    Coupon
                    {coupon && <span className="chip chip-soft">{coupon.code}</span>}
                  </dt>
                  <dd className="font-semibold tabular-nums">−{formatPrice(summary.discount)}</dd>
                </div>
              )}

              {/* The applied coupon is scoped to the OTHER payment method — say
                  so instead of silently dropping the discount. */}
              {coupon && summary.couponBlocked && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Coupon <span className="font-bold">{coupon.code}</span> works only on{" "}
                  {summary.couponBlocked === "prepaid" ? "prepaid (pay online)" : "Cash on Delivery"} orders —{" "}
                  {summary.couponBlocked === "prepaid"
                    ? "choose Pay Online to use it."
                    : "choose Cash on Delivery to use it."}
                </p>
              )}

              {summary.prepaidDiscount > 0 && (
                <div className="flex items-center justify-between text-brand">
                  <dt className="flex items-center gap-1.5">
                    Prepaid discount
                    <span className="chip chip-gold">{summary.prepaidPercent}% OFF</span>
                  </dt>
                  <dd className="font-semibold tabular-nums">−{formatPrice(summary.prepaidDiscount)}</dd>
                </div>
              )}

              <div className="flex items-center justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-semibold tabular-nums">
                  {summary.shipping === 0 ? (
                    <span className="text-brand">FREE</span>
                  ) : (
                    formatPrice(summary.shipping)
                  )}
                </dd>
              </div>
            </dl>

            <div className="border-t border-line px-5 py-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-base font-bold text-ink">Total payable</span>
                  <p className="text-xs text-muted">Inclusive of all taxes</p>
                </div>
                <span className="text-2xl font-extrabold tabular-nums text-ink">
                  {formatPrice(summary.total)}
                </span>
              </div>

              {summary.discount + summary.prepaidDiscount > 0 && (
                <p className="mt-3 flex items-center gap-2 rounded-brand bg-mint px-3 py-2 text-xs font-bold text-brand-dark">
                  <span aria-hidden>🎉</span>
                  You&apos;re saving {formatPrice(summary.discount + summary.prepaidDiscount)} on this order
                </p>
              )}

              {payment === "cod" && summary.prepaidSaving > 0 && onlineAllowed && (
                <button
                  type="button"
                  onClick={() => setPayment("razorpay")}
                  className="mt-3 flex w-full items-center gap-2 rounded-brand bg-gold/10 px-3 py-2 text-left text-xs font-semibold text-ink ring-1 ring-gold/25 transition-colors hover:bg-gold/20"
                >
                  <span aria-hidden>💳</span>
                  Pay online instead and save {formatPrice(summary.prepaidSaving)}
                  <Icon name="arrow-right" size={14} className="ml-auto flex-none text-gold" />
                </button>
              )}

              {quoteError && (
                <p className="mt-3 rounded-brand bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  We couldn&apos;t confirm today&apos;s prices with the server. The amount above is an
                  estimate — the total charged is always the one we confirm when you place the order.
                </p>
              )}

              {/* Desktop CTA — the mobile one lives in the sticky bar below */}
              <div className="mt-4 hidden lg:block">
                <Button block size="lg" onClick={placeOrder} disabled={ctaDisabled}>
                  {ctaLabel}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-brand border border-line bg-white p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-ink">
              <Icon name="shield-check" size={18} className="text-brand" />
              {payment === "razorpay" ? "Secured by Razorpay" : "Safe & secure checkout"}
            </div>
            <p className="mt-1.5 text-center text-xs text-muted">
              {payment === "razorpay"
                ? "Payment is completed on Razorpay's encrypted page — UPI, cards, netbanking & wallets."
                : "Pay cash when your order is delivered. No advance payment needed."}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {siteConfig.paymentMethods.map((p) => (
                <span
                  key={p.label}
                  className="inline-flex items-center gap-1 rounded-lg bg-soft px-2 py-1 text-[11px] font-semibold text-muted ring-1 ring-line"
                >
                  <span aria-hidden>{p.icon}</span>
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          <p className="px-1 pb-24 text-center text-xs text-muted lg:pb-0">
            Estimated delivery by {formatDate(estimateDelivery())}. By placing your order you agree to
            Meenazo&apos;s{" "}
            <Link href="/terms" className="font-semibold text-brand hover:underline">
              terms
            </Link>{" "}
            &amp;{" "}
            <Link href="/return-policy" className="font-semibold text-brand hover:underline">
              refund policy
            </Link>
            .
          </p>
        </aside>
      </div>

      {/* ---- Mobile sticky action bar ---- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 shadow-[0_-8px_30px_rgba(31,42,36,.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex-none">
            <p className="text-[11px] leading-none text-muted">Total payable</p>
            <p className="text-lg font-extrabold leading-tight tabular-nums text-ink">
              {formatPrice(summary.total)}
            </p>
          </div>
          <Button className="flex-1" size="lg" onClick={placeOrder} disabled={ctaDisabled}>
            {placing ? (payment === "razorpay" ? "Processing…" : "Placing…") : awaitingFirstQuote ? "Checking…" : payment === "razorpay" ? "Pay securely" : "Place order"}
          </Button>
        </div>
      </div>
    </>
  );
}
