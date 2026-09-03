"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { SessionFormat } from "@/lib/database.types";

const APPOINTMENT_TYPE_LABEL: Record<SessionFormat, string> = {
  online: "Online session (video)",
  call: "Phone or WhatsApp call",
  in_person: "In-person",
};

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export type ReviewDetails = {
  therapistName: string;
  therapistSpecialty: string | null;
  selectedDate: string;
  selectedStartTime: string;
  selectedEndTime: string;
  timeZone: string;
  appointmentType: SessionFormat;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCity: string;
};

// Phase 129 — the required "Review your appointment" step between the
// client self-reporting a slot and the appointment actually being marked
// confirmed. Nothing here writes anything yet — this is purely a review;
// the write happens in onConfirm (see BookSessionButton.tsx, which calls
// /api/diary-appointment/confirm).
export default function ScheduleReviewModal({
  details,
  pending,
  error,
  onConfirm,
  onBackToCalendar,
  onCancel,
}: {
  details: ReviewDetails;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onBackToCalendar: () => void;
  onCancel: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  const busy = pending || confirming;

  return (
    <Modal open onClose={onCancel}>
      <h2 className="mb-1.5 text-xl">Review your appointment</h2>
      <p className="mb-5 text-[14px] text-muted-fg">
        Double check everything below before confirming — you can still go back and pick a different time.
      </p>

      <dl className="flex flex-col divide-y divide-border rounded-xl border border-border">
        <Row label="Professional" value={details.therapistName} />
        {details.therapistSpecialty && <Row label="Specialty" value={details.therapistSpecialty} />}
        <Row label="Date" value={formatDisplayDate(details.selectedDate)} />
        <Row label="Time" value={`${formatTime(details.selectedStartTime)} – ${formatTime(details.selectedEndTime)}`} />
        <Row label="Time zone" value={details.timeZone || "Not specified"} />
        <Row label="Session type" value={APPOINTMENT_TYPE_LABEL[details.appointmentType]} />
        <Row label="Your name" value={details.clientName} />
        <Row label="Your email" value={details.clientEmail} />
        <Row label="Your phone" value={details.clientPhone} />
        <Row label="Your city / address" value={details.clientCity} />
      </dl>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-5 flex flex-col gap-2.5">
        <Button type="button" onClick={handleConfirm} disabled={busy} block>
          {busy ? "Confirming…" : "Confirm schedule"}
        </Button>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onBackToCalendar} disabled={busy} className="flex-1">
            Back to calendar
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="flex-1">
            Cancel booking
          </Button>
        </div>
      </div>
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
