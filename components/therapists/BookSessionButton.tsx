"use client";

import { useRef, useState } from "react";
import { CalendarClock, ExternalLink, RefreshCcw } from "lucide-react";
import IntakeBookingModal from "@/components/intake/IntakeBookingModal";
import BookingIntakeModal from "@/components/booking/BookingIntakeModal";
import Button from "@/components/ui/Button";
import type { PublicTherapistRow } from "@/lib/database.types";

// "Book a Session" from the Our Therapists directory. Reuses the same
// conflict-free scheduling flow built for the homepage's "Reach out now"
// paths (Phase 20) — real open slots pulled from /api/therapist-availability,
// reserved via /api/intake-booking against a DB-level UNIQUE(therapist_id,
// session_date, session_time) constraint, so a booking made from this page
// gets the exact same double-booking protection and lands in the same
// session_bookings table (visible in the CRM at /admin/sessions). Tagged with
// path "directory" so admins can tell it apart from the homepage entry paths.
//
// Phase 126 — branches on whether the therapist has a scheduling link:
//   - diary_link set and diary_link_status !== "invalid": send the client
//     straight to the therapist's own scheduling page in a new tab. We don't
//     embed it — none of the three providers in use (Google Calendar
//     appointment schedules, Calendly, simplybook.it) reliably support being
//     framed, and a broken iframe is worse than a new tab. Recorded as a
//     "opened" diary_scheduling_events row, never "confirmed" — there's no
//     callback from any of these providers telling us the client actually
//     picked a slot.
//   - otherwise: unchanged native date/time picker flow below.
//
// Phase 128 — the diary-link branch no longer opens the scheduler
// immediately on click. It now opens BookingIntakeModal first ("Before you
// book your session"); only once that intake form is validated and saved
// does this component open the therapist's actual scheduler — the same
// `openDiaryLink` function as before, just called from `onSuccess` instead
// of directly from the button's `onClick`. The therapist this opens is
// always whichever `therapist` prop this specific button instance was
// rendered with — there's exactly one BookSessionButton per therapist card/
// profile, so there's no shared state that could point the modal at the
// wrong professional's calendar.
export default function BookSessionButton({ therapist }: { therapist: PublicTherapistRow }) {
  const [open, setOpen] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [calendarError, setCalendarError] = useState(false);
  const [pendingIntakeId, setPendingIntakeId] = useState<string | null>(null);
  // Guards against firing a duplicate diary_scheduling_events row if
  // someone double-clicks "Try again" after the calendar already opened
  // once, or comes back and re-triggers the same successful intake.
  const recordedRef = useRef(false);

  const hasDiaryLink = Boolean(therapist.diary_link) && therapist.diary_link_status !== "invalid";

  function openDiaryLink(intakeId: string) {
    if (!therapist.diary_link) return;
    const popup = window.open(therapist.diary_link, "_blank", "noopener,noreferrer");
    if (!popup) {
      // Most likely a popup blocker — the intake record is already saved
      // (intakeId proves it), so this is purely "try opening the calendar
      // again," not "fill out the form again."
      setPendingIntakeId(intakeId);
      setCalendarError(true);
      return;
    }
    setCalendarError(false);
    setPendingIntakeId(null);
    if (!recordedRef.current) {
      recordedRef.current = true;
      const timeZone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
      // Fire-and-forget — a failed notification shouldn't block the client
      // from reaching the therapist's scheduling page, which already
      // happened above.
      fetch("/api/diary-scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId: therapist.id,
          diaryLink: therapist.diary_link,
          therapistName: therapist.full_name,
          timeZone,
          intakeSubmissionId: intakeId,
        }),
      }).catch(() => {});
    }
  }

  function onIntakeSuccess(intakeId: string) {
    setShowIntake(false);
    openDiaryLink(intakeId);
  }

  if (hasDiaryLink) {
    return (
      <>
        <button
          onClick={() => {
            setCalendarError(false);
            setShowIntake(true);
          }}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <CalendarClock size={14} /> Choose a date and time <ExternalLink size={12} />
        </button>
        {showIntake && (
          <BookingIntakeModal
            therapistId={therapist.id}
            therapistName={therapist.full_name}
            onClose={() => setShowIntake(false)}
            onSuccess={onIntakeSuccess}
          />
        )}
        {calendarError && !showIntake && (
          <div className="mt-2 flex flex-col items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3">
            <p className="text-[13px] text-destructive">
              We couldn&apos;t open {therapist.full_name}&apos;s calendar — your details are already saved, so
              you won&apos;t need to fill out the form again.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => pendingIntakeId && openDiaryLink(pendingIntakeId)}
            >
              <RefreshCcw size={13} /> Try again
            </Button>
          </div>
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
