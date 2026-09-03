"use client";

import { useState } from "react";
import { CalendarClock, ExternalLink, RefreshCcw } from "lucide-react";
import IntakeBookingModal from "@/components/intake/IntakeBookingModal";
import BookingIntakeModal, { type IntakeSuccessDetails } from "@/components/booking/BookingIntakeModal";
import SlotSelectionModal from "@/components/booking/SlotSelectionModal";
import ScheduleReviewModal, { type ReviewDetails } from "@/components/booking/ScheduleReviewModal";
import BookingSuccessModal from "@/components/booking/BookingSuccessModal";
import Button from "@/components/ui/Button";
import type { PublicTherapistRow, SessionFormat } from "@/lib/database.types";

// "Book a Session" from the Our Therapists directory. Reuses the same
// conflict-free scheduling flow built for the homepage's "Reach out now"
// paths (Phase 20) — real open slots pulled from /api/therapist-availability,
// reserved via /api/intake-booking against a DB-level UNIQUE(therapist_id,
// session_date, session_time) constraint, so a booking made from this page
// gets the exact same double-booking protection and lands in the same
// session_bookings table (visible in the CRM at /admin/sessions). Tagged with
// path "directory" so admins can tell it apart from the homepage entry paths.
//
// Phase 126 — branches on whether the therapist has a scheduling link.
// Phase 128 — the diary-link branch requires the intake modal first.
// Phase 129 — the full flow after intake: open the therapist's own
// calendar -> client returns and self-reports the slot they picked (no
// diary provider in use gives this app a webhook for the real selection) ->
// review screen -> Confirm schedule -> success screen. Every step below is
// scoped to this one `therapist` prop; there is exactly one
// BookSessionButton per therapist card/profile, so there is no shared state
// that could point any of these modals at a different professional's
// calendar or confirmation.
type Stage =
  | "idle"
  | "intake"
  | "openingCalendar"
  | "awaitingReturn"
  | "calendarError"
  | "selectingSlot"
  | "reviewing"
  | "success";

type SlotSelection = {
  selectedDate: string;
  selectedStartTime: string;
  selectedEndTime: string;
  durationMinutes: number;
  timeZone: string;
  appointmentType: SessionFormat;
};

export default function BookSessionButton({ therapist }: { therapist: PublicTherapistRow }) {
  const [open, setOpen] = useState(false); // native flow modal
  const [stage, setStage] = useState<Stage>("idle");
  // The intake record's id — kept around separately from `eventId` because
  // a popup-blocked retry can happen *before* `/api/diary-scheduling` ever
  // returns an event id (the failure is in opening the window itself, not
  // in recording it), so retrying still needs to know which already-saved
  // intake to hand off.
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<IntakeSuccessDetails | null>(null);
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [successData, setSuccessData] = useState<{
    therapistName: string;
    date: string;
    startTime: string;
    durationMinutes: number | null;
    timeZone: string | null;
    referenceNumber: string;
    clientEmail: string;
  } | null>(null);

  const hasDiaryLink = Boolean(therapist.diary_link) && therapist.diary_link_status !== "invalid";

  function resetAll() {
    setStage("idle");
    setIntakeId(null);
    setEventId(null);
    setClientDetails(null);
    setSlot(null);
    setConfirmError(null);
  }

  // Opens the therapist's own calendar and records the handoff. Called both
  // right after a successful intake submission, and again from "Try again"
  // if the popup was blocked the first time, and again from "Back to
  // calendar" on the review screen — always the same therapist's diary_link,
  // never anything else.
  async function openCalendar(forIntakeId: string) {
    if (!therapist.diary_link) return;
    setIntakeId(forIntakeId);
    setStage("openingCalendar");
    const popup = window.open(therapist.diary_link, "_blank", "noopener,noreferrer");
    if (!popup) {
      setStage("calendarError");
      return;
    }
    const timeZone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
    try {
      const res = await fetch("/api/diary-scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId: therapist.id,
          diaryLink: therapist.diary_link,
          therapistName: therapist.full_name,
          timeZone,
          intakeSubmissionId: forIntakeId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) throw new Error("no id");
      setEventId(data.id as string);
      setStage("awaitingReturn");
    } catch {
      setStage("calendarError");
    }
  }

  function onIntakeSuccess(newIntakeId: string, details: IntakeSuccessDetails) {
    setClientDetails(details);
    openCalendar(newIntakeId);
  }

  function onSlotSelected(selection: SlotSelection) {
    setSlot(selection);
    setStage("reviewing");
  }

  async function onConfirm() {
    if (!eventId) return;
    setConfirmPending(true);
    setConfirmError(null);
    try {
      const res = await fetch("/api/diary-appointment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setConfirmError(data?.error || "Something went wrong — please try again.");
        return;
      }
      setSuccessData({
        therapistName: data.therapistName ?? therapist.full_name,
        date: data.selectedDate ?? slot?.selectedDate ?? "",
        startTime: data.selectedStartTime ?? slot?.selectedStartTime ?? "",
        durationMinutes: data.durationMinutes ?? slot?.durationMinutes ?? null,
        timeZone: data.timeZone ?? slot?.timeZone ?? null,
        referenceNumber: data.referenceNumber ?? `GESA-${eventId.slice(0, 8).toUpperCase()}`,
        clientEmail: data.clientEmail ?? clientDetails?.clientEmail ?? "",
      });
      setStage("success");
    } catch {
      setConfirmError("Something went wrong — please try again.");
    } finally {
      setConfirmPending(false);
    }
  }

  async function onCancelBooking() {
    if (eventId) {
      fetch("/api/diary-appointment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      }).catch(() => {});
    }
    resetAll();
  }

  if (hasDiaryLink) {
    const specialty = therapist.specialties?.[0] ?? null;
    const reviewDetails: ReviewDetails | null =
      slot && clientDetails
        ? {
            therapistName: therapist.full_name,
            therapistSpecialty: specialty,
            selectedDate: slot.selectedDate,
            selectedStartTime: slot.selectedStartTime,
            selectedEndTime: slot.selectedEndTime,
            timeZone: slot.timeZone,
            appointmentType: slot.appointmentType,
            clientName: clientDetails.clientName,
            clientEmail: clientDetails.clientEmail,
            clientPhone: clientDetails.clientPhone,
            clientCity: clientDetails.clientCity,
          }
        : null;

    return (
      <>
        <button
          onClick={() => setStage("intake")}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <CalendarClock size={14} /> Choose a date and time <ExternalLink size={12} />
        </button>

        {stage === "intake" && (
          <BookingIntakeModal
            therapistId={therapist.id}
            therapistName={therapist.full_name}
            onClose={resetAll}
            onSuccess={onIntakeSuccess}
          />
        )}

        {stage === "openingCalendar" && (
          <div className="mt-2 rounded-xl bg-secondary/60 px-3.5 py-3 text-[13px] text-muted-fg" role="status">
            Opening {therapist.full_name}&apos;s calendar…
          </div>
        )}

        {stage === "calendarError" && (
          <div className="mt-2 flex flex-col items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3">
            <p className="text-[13px] text-destructive">
              We couldn&apos;t open {therapist.full_name}&apos;s calendar — your details are already saved, so
              you won&apos;t need to fill out the form again.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => intakeId && openCalendar(intakeId)}>
              <RefreshCcw size={13} /> Try again
            </Button>
          </div>
        )}

        {stage === "awaitingReturn" && (
          <div className="mt-2 flex flex-col items-start gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-3">
            <p className="text-[13px] text-muted-fg">
              Once you&apos;ve picked a time on {therapist.full_name}&apos;s calendar tab, come back here to
              finish your booking.
            </p>
            <Button type="button" size="sm" onClick={() => setStage("selectingSlot")}>
              I selected a time — continue
            </Button>
          </div>
        )}

        {stage === "selectingSlot" && eventId && (
          <SlotSelectionModal
            eventId={eventId}
            therapistName={therapist.full_name}
            onClose={() => setStage("awaitingReturn")}
            onSuccess={onSlotSelected}
          />
        )}

        {stage === "reviewing" && reviewDetails && (
          <ScheduleReviewModal
            details={reviewDetails}
            pending={confirmPending}
            error={confirmError}
            onConfirm={onConfirm}
            onBackToCalendar={() => {
              setConfirmError(null);
              // Literally reopens the therapist's own calendar tab again
              // (same diary_link, same intake record) rather than just
              // re-showing the self-report form — "back to calendar" should
              // actually go back to the calendar.
              if (intakeId) openCalendar(intakeId);
            }}
            onCancel={onCancelBooking}
          />
        )}

        {stage === "success" && successData && (
          <BookingSuccessModal
            therapistName={successData.therapistName}
            date={successData.date}
            startTime={successData.startTime}
            durationMinutes={successData.durationMinutes}
            timeZone={successData.timeZone}
            referenceNumber={successData.referenceNumber}
            clientEmail={successData.clientEmail}
            onClose={resetAll}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-600"
      >
        <CalendarClock size={14} /> Book a Session
      </button>
      {open && (
        <IntakeBookingModal
          therapist={therapist}
          pathKey="directory"
          onClose={() => setOpen(false)}
          onPickDifferentTherapist={() => setOpen(false)}
        />
      )}
    </>
  );
}
