"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Phase 196 — Professional Services' required payment step, shown after
// ScheduleReviewModal's "Continue to payment" and before
// /api/diary-appointment/confirm is ever called (see BookSessionButton.tsx).
// Loads PayPal's own Smart Payment Buttons SDK (NEXT_PUBLIC_PAYPAL_CLIENT_ID
// only — never a secret) and renders its Buttons UI, which handles the
// actual approve/cancel/error flow in PayPal's own hosted UI. This
// component itself never touches card data or PayPal credentials directly;
// it only calls this app's own /api/payments/paypal/create-order and
// /api/payments/paypal/capture-order routes, which hold the real secret
// server-side.
export type PaymentSummary = {
  therapistName: string;
  date: string; // already formatted for display
  time: string; // already formatted for display
  durationMinutes: number | null;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onCancel?: () => void;
        onError?: (err: unknown) => void;
      }) => { render: (selector: string) => void };
    };
  }
}

export default function PaymentModal({
  eventId,
  summary,
  onClose,
  onPaid,
}: {
  eventId: string;
  summary: PaymentSummary;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [sdkReady, setSdkReady] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{ amount: number; currency: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [processing, setProcessing] = useState(false);
  const buttonsRenderedRef = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Create the PayPal order as soon as this screen opens, purely to learn
  // the price to display — the order itself is created fresh (idempotent on
  // our side, since create-order re-derives the price from the therapist
  // each time) rather than reusing a stale one if the client backs out and
  // returns.
  useEffect(() => {
    let cancelled = false;
    setLoadingOrder(true);
    setError(null);
    fetch("/api/payments/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Could not start checkout.");
        if (!cancelled) setOrderInfo({ amount: data.amount, currency: data.currency });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not start checkout.");
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (!sdkReady || !orderInfo || buttonsRenderedRef.current || !window.paypal) return;
    buttonsRenderedRef.current = true;
    window.paypal
      .Buttons({
        createOrder: async () => {
          setError(null);
          const res = await fetch("/api/payments/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.orderId) throw new Error(data?.error || "Could not start checkout.");
          return data.orderId as string;
        },
        onApprove: async (data) => {
          setProcessing(true);
          setError(null);
          try {
            const res = await fetch("/api/payments/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ eventId, orderId: data.orderID }),
            });
            const result = await res.json().catch(() => null);
            if (!res.ok) throw new Error(result?.error || "Payment was not successful.");
            onPaid();
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Payment was not successful — please try again or use a different payment method."
            );
          } finally {
            setProcessing(false);
          }
        },
        onCancel: () => {
          // Spec: cancelling returns the client to the booking/payment
          // summary without creating a confirmed booking — nothing to undo
          // here, since capture only ever runs after a real approval.
          setError(null);
        },
        onError: () => {
          setError("Something went wrong with PayPal — please try again.");
        },
      })
      .render("#paypal-buttons-container");
  }, [sdkReady, orderInfo, eventId, onPaid]);

  return (
    <Modal open onClose={onClose}>
      {clientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${orderInfo?.currency ?? "USD"}`}
          onLoad={() => setSdkReady(true)}
          strategy="afterInteractive"
        />
      )}
      <h2 className="mb-1.5 text-xl">Pay and confirm your booking</h2>
      <p className="mb-5 text-[14px] text-muted-fg">
        Professional Services are paid sessions. Complete payment below to confirm your booking — nothing is charged
        until you approve it on PayPal.
      </p>

      <dl className="mb-5 flex flex-col divide-y divide-border rounded-xl border border-border">
        <Row label="Professional" value={summary.therapistName} />
        <Row label="Date" value={summary.date} />
        <Row label="Time" value={summary.time} />
        {summary.durationMinutes && <Row label="Session duration" value={`${summary.durationMinutes} minutes`} />}
        <Row
          label="Session price"
          value={loadingOrder || !orderInfo ? "Loading…" : `${orderInfo.amount.toFixed(2)} ${orderInfo.currency}`}
        />
        <Row
          label="Total amount due"
          value={loadingOrder || !orderInfo ? "Loading…" : `${orderInfo.amount.toFixed(2)} ${orderInfo.currency}`}
        />
      </dl>

      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {processing && <p className="mb-3 text-[13.5px] text-muted-fg">Confirming your payment…</p>}

      {!loadingOrder && orderInfo && <div id="paypal-buttons-container" />}

      <Button type="button" variant="outline" onClick={onClose} disabled={processing} block className="mt-3">
        Cancel
      </Button>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
      <dt className="text-muted-fg">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
