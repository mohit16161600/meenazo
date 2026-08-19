"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ResourceForm } from "@/app/panel/_components/ResourceForm";
import { Badge, Button, Card } from "@/app/panel/_components/ui";
import { useToast } from "@/app/panel/_components/toast";
import { apiGet, apiPost, type ApiError } from "@/app/panel/_lib/api";

interface OrderLite {
  orderNumber?: string;
  status?: string;
  easyecomSynced?: boolean;
  easyecomRef?: string;
  whatsappSentAt?: string | null;
  paymentMethod?: string;
  amountPaid?: number | null;
  total?: number;
}

/**
 * Admin quick actions for one order: force-push to EasyEcom now, re-send the
 * WhatsApp confirmation, or cancel. The EasyEcom/WhatsApp audit fields below
 * are read-only - these buttons are the ONLY way to change that state by hand.
 */
function OrderQuickActions({ id, onOrderChanged }: { id: string; onOrderChanged: () => void }) {
  const toast = useToast();
  const [order, setOrder] = useState<OrderLite | null>(null);
  const [busy, setBusy] = useState<"push" | "cancel" | "reset" | "notify" | "payment" | null>(null);

  const load = useCallback(() => {
    apiGet<{ item: OrderLite }>(`/orders/${encodeURIComponent(id)}`)
      .then((res) => setOrder(res.item))
      .catch(() => setOrder(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!order) return null;

  const cancelled = String(order.status ?? "").toLowerCase() === "cancelled";
  const synced = !!order.easyecomSynced;
  // Online order that isn't recorded as paid yet — the case worth re-checking
  // against Razorpay (the customer may have paid and lost the callback).
  const unpaidOnline =
    String(order.paymentMethod ?? "").toLowerCase() === "razorpay" &&
    Number(order.amountPaid ?? 0) < Number(order.total ?? 0);

  async function pushNow() {
    if (
      !window.confirm(
        `Push order ${order?.orderNumber ?? id} to EasyEcom RIGHT NOW (skipping the hold window)? ` +
          "It will go for real fulfillment and may be shipped."
      )
    )
      return;
    setBusy("push");
    try {
      const res = await apiPost<{ message?: string }>(`/orders/${encodeURIComponent(id)}/push`);
      toast.push("success", res.message ?? "Pushed to EasyEcom.");
      window.location.reload();
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Push failed.");
      setBusy(null);
      load();
    }
  }

  async function resetPush() {
    if (
      !window.confirm(
        `Re-queue order ${order?.orderNumber ?? id} for EasyEcom?\n\n` +
          "Only do this if the order did NOT actually reach EasyEcom. " +
          "If it really is there, pushing again will create a DUPLICATE order."
      )
    )
      return;
    setBusy("reset");
    try {
      const res = await apiPost<{ message?: string }>(`/orders/${encodeURIComponent(id)}/reset-push`);
      toast.push("success", res.message ?? "Re-queued.");
      window.location.reload();
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Reset failed.");
      setBusy(null);
    }
  }

  async function checkPayment() {
    setBusy("payment");
    try {
      const res = await apiPost<{ message?: string }>(`/orders/${encodeURIComponent(id)}/verify-payment`);
      toast.push("success", res.message ?? "Payment confirmed.");
      window.location.reload();
    } catch (e) {
      // "Not paid" is a legitimate answer, not a crash — show Razorpay's verdict.
      const err = e as ApiError;
      toast.push("error", err.message ?? "Could not check the payment.");
      setBusy(null);
      load();
      // A "not paid" verdict re-prices the order (the pay-online discount is
      // taken back). Pull the form again or it would keep showing — and on the
      // next save write back — the discounted total. The error toast is sticky,
      // so this refreshes the data without throwing the verdict away.
      if (err.data?.repriced) onOrderChanged();
    }
  }

  async function sendWhatsapp() {
    const already = Boolean(order?.whatsappSentAt);
    if (
      already &&
      !window.confirm(
        `A confirmation was already sent for ${order?.orderNumber ?? id}.\n\nSend it again? The customer will get a second message.`
      )
    )
      return;
    setBusy("notify");
    try {
      const res = await apiPost<{ message?: string }>(`/orders/${encodeURIComponent(id)}/notify`);
      toast.push("success", res.message ?? "WhatsApp confirmation sent.");
      window.location.reload();
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Could not send the WhatsApp confirmation.");
      setBusy(null);
      load();
    }
  }

  async function cancelOrder() {
    if (
      !window.confirm(
        `Cancel order ${order?.orderNumber ?? id}?` +
          (synced
            ? "\n\nThis order is already in EasyEcom - it will be cancelled there too."
            : "\n\nIt hasn't reached EasyEcom, so it simply won't be sent.")
      )
    )
      return;
    setBusy("cancel");
    try {
      const res = await apiPost<{ message?: string; warning?: boolean }>(
        `/orders/${encodeURIComponent(id)}/cancel`
      );
      // Local cancel always succeeds; EasyEcom may still refuse - say so loudly
      // instead of a green "done" that hides a live order about to ship.
      toast.push(res.warning ? "error" : "success", res.message ?? "Order cancelled.");
      if (res.warning) setBusy(null);
      else window.location.reload();
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Cancel failed.");
      setBusy(null);
    }
  }

  return (
    <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 border-brand/20 bg-mint/40 p-4">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-ink">{order.orderNumber ?? id}</span>
        {cancelled ? (
          <Badge tone="red">Cancelled</Badge>
        ) : synced ? (
          <Badge tone="green">EasyEcom ✓{order.easyecomRef ? ` · ${order.easyecomRef}` : ""}</Badge>
        ) : (
          <Badge tone="amber">Not pushed yet</Badge>
        )}
        {unpaidOnline && <Badge tone="red">Payment not received</Badge>}
        {order.whatsappSentAt ? (
          <Badge tone="green">WhatsApp ✓</Badge>
        ) : (
          <Badge tone="amber">No WhatsApp yet</Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {unpaidOnline && (
          <Button
            variant="outline"
            icon="refresh"
            onClick={checkPayment}
            loading={busy === "payment"}
            disabled={busy !== null}
          >
            Check payment with Razorpay
          </Button>
        )}
        <Button
          variant="outline"
          icon="message"
          onClick={sendWhatsapp}
          loading={busy === "notify"}
          disabled={busy !== null}
        >
          {order.whatsappSentAt ? "Resend WhatsApp" : "Send WhatsApp confirmation"}
        </Button>
        {synced ? (
          <Button
            variant="outline"
            icon="refresh"
            onClick={resetPush}
            loading={busy === "reset"}
            disabled={busy !== null}
          >
            Re-queue (undo pushed mark)
          </Button>
        ) : (
          <Button
            variant="outline"
            icon="upload"
            onClick={pushNow}
            loading={busy === "push"}
            disabled={busy !== null || cancelled}
          >
            Push to EasyEcom now
          </Button>
        )}
        <Button
          variant="danger"
          icon="x"
          onClick={cancelOrder}
          loading={busy === "cancel"}
          disabled={busy !== null || cancelled}
        >
          {cancelled ? "Cancelled" : "Cancel order"}
        </Button>
      </div>
    </Card>
  );
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  // Bumped when a quick action changes the order server-side — remounting the
  // form is what makes it re-read the row instead of showing stale money.
  const [formKey, setFormKey] = useState(0);
  return (
    <div>
      {id !== "new" && (
        <OrderQuickActions id={id} onOrderChanged={() => setFormKey((k) => k + 1)} />
      )}
      <ResourceForm key={formKey} resourceName="orders" id={id} />
    </div>
  );
}
