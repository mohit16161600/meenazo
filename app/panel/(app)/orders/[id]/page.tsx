"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { ResourceForm } from "@/app/panel/_components/ResourceForm";
import { Badge, Button, Card, LoadingBlock } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { useToast } from "@/app/panel/_components/toast";
import { apiGet, apiPost, type ApiError } from "@/app/panel/_lib/api";

import { OrderDetail } from "./OrderDetail";
import type { PanelOrder } from "./types";
import { fmtDateTime, fmtMoney, fmtRelative, paymentLabel, statusTone } from "./format";

/**
 * One order, end to end.
 * ---------------------------------------------------------------------------
 * Two modes on purpose. "Details" is the read view the owner works from —
 * items, money, timeline, fulfillment, all dense and grouped by the question it
 * answers. "Edit" is the generic ResourceForm, kept because it is still the
 * only way to change status, tracking or the note by hand.
 *
 * The action buttons live in the header of BOTH modes: pushing to EasyEcom or
 * cancelling should never require hunting for the right tab.
 */

type Busy = "push" | "cancel" | "reset" | "notify" | "payment" | null;

export default function Page() {
  const { id } = useParams<{ id: string }>();
  // A brand-new order has nothing to show yet — go straight to the form.
  if (id === "new") return <ResourceForm resourceName="orders" id="new" />;
  return <OrderScreen id={id} />;
}

function OrderScreen({ id }: { id: string }) {
  const toast = useToast();
  const [order, setOrder] = useState<PanelOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"detail" | "edit">("detail");
  const [busy, setBusy] = useState<Busy>(null);
  // Bumped when an action changes the order server-side — remounting the form
  // is what makes it re-read the row instead of showing stale money.
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(() => {
    return apiGet<{ item: PanelOrder }>(`/orders/${encodeURIComponent(id)}`)
      .then((res) => setOrder(res.item))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingBlock label="Loading order…" />;
  if (!order)
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted">This order could not be loaded.</p>
        <Link href="/panel/orders" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          ← Back to orders
        </Link>
      </Card>
    );

  const label = order.orderNumber ?? String(id);
  const cancelled = String(order.status ?? "").toLowerCase() === "cancelled";
  const synced = !!order.easyecomSynced;
  const pay = paymentLabel(order);
  // Online order not recorded as paid — the case worth re-checking with Razorpay
  // (the customer may have paid and lost the callback).
  const unpaidOnline =
    String(order.paymentMethod ?? "").toLowerCase() === "razorpay" &&
    Number(order.amountPaid ?? 0) < Number(order.total ?? 0);

  /* ------------------------------- actions ------------------------------- */

  async function act(
    kind: Exclude<Busy, null>,
    path: string,
    confirmText: string | null,
    okFallback: string
  ) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(kind);
    try {
      const res = await apiPost<{ message?: string; warning?: boolean }>(
        `/orders/${encodeURIComponent(id)}/${path}`
      );
      toast.push(res.warning ? "error" : "success", res.message ?? okFallback);
      setBusy(null);
      setFormKey((k) => k + 1);
      await load();
    } catch (e) {
      const err = e as ApiError;
      toast.push("error", err.message ?? "That didn't work.");
      setBusy(null);
      // A "not paid" verdict re-prices the order — pull the row again so the
      // screen stops showing a discount the customer never earned.
      if (err.data?.repriced) setFormKey((k) => k + 1);
      await load();
    }
  }

  const pushNow = () =>
    act(
      "push",
      "push",
      `Push order ${label} to EasyEcom RIGHT NOW (skipping the hold window)?\n\nIt will go for real fulfillment and may be shipped.`,
      "Pushed to EasyEcom."
    );

  const resetPush = () =>
    act(
      "reset",
      "reset-push",
      `Re-queue order ${label} for EasyEcom?\n\nOnly do this if the order did NOT actually reach EasyEcom. If it really is there, pushing again will create a DUPLICATE order.`,
      "Re-queued."
    );

  const checkPayment = () => act("payment", "verify-payment", null, "Payment confirmed.");

  const sendWhatsapp = () =>
    act(
      "notify",
      "notify",
      order?.whatsappSentAt
        ? `A confirmation was already sent for ${label}.\n\nSend it again? The customer will get a second message.`
        : null,
      "WhatsApp confirmation sent."
    );

  const cancelOrder = () =>
    act(
      "cancel",
      "cancel",
      `Cancel order ${label}?` +
        (synced
          ? "\n\nThis order is already in EasyEcom — it will be cancelled there too."
          : "\n\nIt hasn't reached EasyEcom, so it simply won't be sent."),
      "Order cancelled."
    );

  /* -------------------------------- render ------------------------------- */

  return (
    <div className="space-y-4">
      {/* ---------------- Header: identity, state, actions ---------------- */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-3">
          <div className="min-w-0">
            <Link
              href="/panel/orders"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted hover:text-brand"
            >
              <Icon name="chevron" size={12} className="rotate-180" /> Orders
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-[20px] font-extrabold tracking-tight text-ink">{label}</h1>
              <Badge tone={statusTone(order.status)}>{order.status ?? "—"}</Badge>
              <Badge tone={pay.tone}>{pay.text}</Badge>
              {synced ? (
                <Badge tone="green">EasyEcom ✓</Badge>
              ) : cancelled ? (
                <Badge tone="neutral">Not sent</Badge>
              ) : (
                <Badge tone="amber">Not pushed</Badge>
              )}
              {order.whatsappSentAt ? (
                <Badge tone="green">WhatsApp ✓</Badge>
              ) : (
                <Badge tone="amber">No WhatsApp</Badge>
              )}
            </div>

            {/* The line that was missing: WHEN this order happened. */}
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1 font-semibold text-ink">
                <Icon name="clock" size={13} className="text-brand" />
                {fmtDateTime(order.createdAt)}
              </span>
              <span>·</span>
              <span>{fmtRelative(order.createdAt)}</span>
              <span>·</span>
              <span className="font-semibold text-ink">{fmtMoney(order.total)}</span>
              {order.customerName && (
                <>
                  <span>·</span>
                  <span>{order.customerName}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unpaidOnline && (
              <Button variant="outline" icon="refresh" onClick={checkPayment} loading={busy === "payment"} disabled={busy !== null}>
                Check payment
              </Button>
            )}
            <Button variant="outline" icon="message" onClick={sendWhatsapp} loading={busy === "notify"} disabled={busy !== null}>
              {order.whatsappSentAt ? "Resend WhatsApp" : "Send WhatsApp"}
            </Button>
            {synced ? (
              <Button variant="outline" icon="refresh" onClick={resetPush} loading={busy === "reset"} disabled={busy !== null}>
                Re-queue
              </Button>
            ) : (
              <Button variant="outline" icon="upload" onClick={pushNow} loading={busy === "push"} disabled={busy !== null || cancelled}>
                Push to EasyEcom now
              </Button>
            )}
            <Button variant="danger" icon="x" onClick={cancelOrder} loading={busy === "cancel"} disabled={busy !== null || cancelled}>
              {cancelled ? "Cancelled" : "Cancel order"}
            </Button>
          </div>
        </div>

        {/* Mode switch sits on the card's bottom edge, tab-style. */}
        <div className="flex gap-1 border-t border-line bg-soft/50 px-3">
          {(["detail", "edit"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition-colors ${
                mode === m
                  ? "border-brand text-brand-dark"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {m === "detail" ? "Details" : "Edit fields"}
            </button>
          ))}
        </div>
      </Card>

      {mode === "detail" ? (
        <OrderDetail order={order} />
      ) : (
        <ResourceForm key={formKey} resourceName="orders" id={id} />
      )}
    </div>
  );
}
