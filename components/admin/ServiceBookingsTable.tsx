"use client";

import { useMemo, useState } from "react";
import type { getAllDiarySchedulingEvents } from "@/lib/queries";

type Event = Awaited<ReturnType<typeof getAllDiarySchedulingEvents>>[number];

const SERVICE_TYPES = ["charity", "professional"] as const;
const BOOKING_STATUSES = [
  "calendar_opened",
  "slot_selected",
  "pending_confirmation",
  "payment_pending",
  "confirmed",
  "cancelled",
  "failed",
] as const;
const PAYMENT_STATUSES = ["not_required", "pending", "paid", "failed", "refunded"] as const;

const STATUS_LABELS: Record<string, string> = {
  calendar_opened: "Calendar opened",
  slot_selected: "Slot selected",
  pending_confirmation: "Pending confirmation",
  payment_pending: "Payment pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  failed: "Failed",
};

const PAYMENT_LABELS: Record<string, string> = {
  not_required: "Not required",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC" });
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  return `${currency ?? "USD"} ${amount.toFixed(2)}`;
}

// Phase 196 — the admin review surface Roy's spec explicitly required
// ("Admin dashboard must allow filtering/reviewing bookings by Charity vs
// Professional, payment status, booking status, therapist, and date
// range"). Read-only by design: unlike the older per-table admin lists in
// this folder (Inquiries, Booking requests, etc.), nothing in Roy's Phase
// 196 spec asked for editing/deleting these rows from the CRM, and the real
// status transitions here are already driven server-side by the booking/
// payment flow itself (BookSessionButton, /api/diary-appointment/confirm,
// the PayPal capture route) — adding a manual override control here would
// be new, unrequested scope with real risk (e.g. an admin marking a
// "professional" booking "confirmed" without payment actually clearing).
// Same client-side filter pattern as InquiriesTable.tsx: plain useState +
// useMemo, no shared filter component exists in this codebase yet.
export default function ServiceBookingsTable({ initialEvents }: { initialEvents: Event[] }) {
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [therapistFilter, setTherapistFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const therapistOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of initialEvents) {
      if (e.therapist) seen.set(e.therapist.id, e.therapist.full_name);
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [initialEvents]);

  const filtered = useMemo(() => {
    return initialEvents.filter((e) => {
      if (serviceFilter !== "all" && e.service_type !== serviceFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (paymentFilter !== "all" && e.payment_status !== paymentFilter) return false;
      if (therapistFilter !== "all" && e.therapist_id !== therapistFilter) return false;
      // Filtered against the client's requested/selected appointment date
      // when one exists, falling back to the row's created_at — same
      // "honest date to show" reasoning as the Overview dashboard's
      // Scheduling Overview calendar (app/admin/page.tsx).
      const rowDate = (e.selected_date ?? e.created_at.slice(0, 10)) as string;
      if (dateFrom && rowDate < dateFrom) return false;
      if (dateTo && rowDate > dateTo) return false;
      return true;
    });
  }, [initialEvents, serviceFilter, statusFilter, paymentFilter, therapistFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setServiceFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setTherapistFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Charity &amp; Professional Services bookings ({initialEvents.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Every booking made through the Community page&apos;s Charity Services and Professional Services entry
          points — client details live on the linked booking intake form; payment fields apply to Professional
          Services only.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">Charity + Professional</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s === "charity" ? "Charity Services" : "Professional Services"}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">All booking statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">All payment statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={therapistFilter}
            onChange={(e) => setTherapistFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">All professionals</option>
            {therapistOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[12.5px] text-muted-fg">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-[13px] focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[12.5px] text-muted-fg">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-[13px] focus:border-primary focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium text-muted-fg hover:text-primary"
          >
            Clear filters
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-6 text-muted-fg">No bookings match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Professional</th>
                <th className="px-5 py-3">Appointment</th>
                <th className="px-5 py-3">Booking status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">{formatDate(e.created_at)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                        e.service_type === "professional" ? "bg-accent-soft text-primary" : "bg-clay-soft text-primary"
                      }`}
                    >
                      {e.service_type === "professional" ? "Professional" : e.service_type === "charity" ? "Charity" : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium">{e.client_name || e.intake_form?.client_name || "—"}</div>
                    <div className="text-[12px] text-muted-fg">
                      {e.client_email || e.intake_form?.client_email || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3">{e.therapist?.full_name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-fg">
                    {e.selected_date ? (
                      <>
                        {formatDate(e.selected_date)}
                        {e.selected_start_time ? ` · ${e.selected_start_time.slice(0, 5)}` : ""}
                      </>
                    ) : (
                      "Not yet selected"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-primary">
                      {STATUS_LABELS[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                        e.payment_status === "paid"
                          ? "bg-primary/10 text-primary"
                          : e.payment_status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-muted-fg"
                      }`}
                    >
                      {PAYMENT_LABELS[e.payment_status] ?? e.payment_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-fg">{formatMoney(e.price_amount, e.price_currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
