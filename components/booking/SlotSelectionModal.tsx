"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { SessionDuration, SessionFormat } from "@/lib/database.types";

const DURATION_OPTIONS: SessionDuration[] = ["30", "45", "60", "90"];
const APPOINTMENT_TYPE_OPTIONS: { value: SessionFormat; label: string }[] = [
  { value: "online", label: "Online session (video)" },
  { value: "call", label: "Phone or WhatsApp call" },
  { value: "in_person", label: "In-person" },
];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// Phase 129 — this is the "otherwise capture the selected slot" fallback
// required because none of the diary providers in use (Google Calendar
// appointment schedules, Calendly, simplybook.it) call back into this app
// with the real slot a client picked. Shown after the client returns from
// the therapist's calendar tab (see BookSessionButton.tsx's "I selected a
// time — continue" prompt). Everything submitted here is what the client
// says they booked, not something GESA verified — the review screen and
// every email downstream say so explicitly.
export default function SlotSelectionModal({
  eventId,
  therapistName,
  onClose,
  onSuccess,
}: {
  eventId: string;
  therapistName: string;
  onClose: () => void;
  onSuccess: (selection: {
    selectedDate: string;
    selectedStartTime: string;
    selectedEndTime: string;
    durationMinutes: number;
    timeZone: string;
    appointmentType: SessionFormat;
  }) => void;
}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState<SessionDuration>("60");
  const [timeZone, setTimeZone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""
  );
  const [appointmentType, setAppointmentType] = useState<SessionFormat>("online");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime) {
      setError("Please enter both a date and a time.");
      return;
    }
    if (date < todayIso) {
      setError("That date is in the past — please double check it.");
      return;
    }
    const durationMinutes = Number(duration);
    const endTime = addMinutes(startTime, durationMinutes);
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/diary-appointment/select-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          selectedDate: date,
          selectedStartTime: startTime,
          selectedEndTime: endTime,
          durationMinutes,
          timeZone: timeZone || null,
          appointmentType,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Something went wrong — please try again.");
        return;
      }
      onSuccess({
        selectedDate: date,
        selectedStartTime: startTime,
        selectedEndTime: endTime,
        durationMinutes,
        timeZone,
        appointmentType,
      });
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open onClose={onClose}>
      <h2 className="mb-1.5 text-xl">What time did you select?</h2>
      <p className="mb-5 text-[14px] text-muted-fg">
        Tell us the date and time you picked on {therapistName}&apos;s calendar so we can save it to your GESA
        booking.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="slot-date" className="mb-1.5 block text-sm font-semibold">
              Date <span className="text-destructive">*</span>
            </label>
            <input
              id="slot-date"
              type="date"
              required
              min={todayIso}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="slot-start-time" className="mb-1.5 block text-sm font-semibold">
              Start time <span className="text-destructive">*</span>
            </label>
            <input
              id="slot-start-time"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="slot-duration" className="mb-1.5 block text-sm font-semibold">
              Session length
            </label>
            <select
              id="slot-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value as SessionDuration)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="slot-type" className="mb-1.5 block text-sm font-semibold">
              Session type
            </label>
            <select
              id="slot-type"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value as SessionFormat)}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            >
              {APPOINTMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="slot-timezone" className="mb-1.5 block text-sm font-semibold">
            Time zone
          </label>
          <input
            id="slot-timezone"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            placeholder="e.g. America/New_York"
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Review appointment"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
