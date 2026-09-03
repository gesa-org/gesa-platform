"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

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

// Phase 129 — shown once /api/diary-appointment/confirm has actually
// succeeded (see BookSessionButton.tsx) — never optimistically before that
// call returns. "View my appointments" is deliberately omitted: there is no
// client-facing "my bookings" page in this app today (only the therapist
// dashboard, and an admin/account settings page), and Roy's own spec made
// that action conditional on one existing — flagging that as not built
// rather than linking somewhere that doesn't exist.
export default function BookingSuccessModal({
  therapistName,
  date,
  startTime,
  durationMinutes,
  timeZone,
  referenceNumber,
  clientEmail,
  onClose,
}: {
  therapistName: string;
  date: string;
  startTime: string;
  durationMinutes: number | null;
  timeZone: string | null;
  referenceNumber: string;
  clientEmail: string;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-primary">
          <CheckCircle2 size={26} />
        </div>
        <h2 className="mb-1.5 text-xl">Your session has been scheduled</h2>
        <p className="mb-5 text-[14.5px] text-muted-fg">
          Your session with <strong className="text-foreground">{therapistName}</strong> has been successfully
          scheduled for <strong className="text-foreground">{formatDisplayDate(date)}</strong> at{" "}
          <strong className="text-foreground">
            {formatTime(startTime)}
            {timeZone ? ` (${timeZone})` : ""}
          </strong>
          . A confirmation has been sent to <strong className="text-foreground">{clientEmail}</strong>.
        </p>

        <dl className="mb-5 flex flex-col divide-y divide-border rounded-xl border border-border text-left">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
            <dt className="text-muted-fg">Reference number</dt>
            <dd className="font-medium">{referenceNumber}</dd>
          </div>
          {durationMinutes && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
              <dt className="text-muted-fg">Session length</dt>
              <dd className="font-medium">{durationMinutes} minutes</dd>
            </div>
          )}
        </dl>

        <p className="mb-5 text-[13px] text-muted-fg">
          Check your email for appointment details — you should also receive a separate confirmation directly
          from {therapistName}&apos;s own scheduling system.
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Link href="/therapists" className="flex-1">
            <Button variant="outline" block onClick={onClose}>
              Back to Our Professionals
            </Button>
          </Link>
          <Button block onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
