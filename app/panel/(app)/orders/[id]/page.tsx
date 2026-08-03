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
}

/**
 * Admin quick actions for one order: force-push to EasyEcom now, or cancel.
 * The EasyEcom audit fields below are read-only - these buttons are the ONLY
 * way to change the push/cancel state by hand.
 */
function OrderQuickActions({ id }: { id: string }) {
  const toast = useToast();
  const [order, setOrder] = useState<OrderLite | null>(null);
  const [busy, setBusy] = useState<"push" | "cancel" | "reset" | null>(null);

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
      </div>
      <div className="flex flex-wrap gap-2">
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
  return (
    <div>
      {id !== "new" && <OrderQuickActions id={id} />}
      <ResourceForm resourceName="orders" id={id} />
    </div>
  );
}
