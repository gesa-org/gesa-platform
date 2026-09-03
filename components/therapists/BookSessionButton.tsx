"use client";

import { useRef, useState } from "react";
import { CalendarClock, ExternalLink } from "lucide-react";
import IntakeBookingModal from "@/components/intake/IntakeBookingModal";
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
export default function BookSessionButton({ therapist }: { therapist: PublicTherapistRow }) {
  const [open, setOpen] = useState(false);
  // Guards against firing a duplicate diary_scheduling_events row if
  // someone double-clicks, or clicks "Choose a date and time" again after
  // coming back to the tab — per-mount only (a full page refresh will
  // record again, since there's no server-side idempotency key for an
  // anonymous, unauthenticated click; a stronger guarantee would need one).
  const recordedRef = useRef(false);

  const hasDiaryLink = Boolean(therapist.diary_link) && therapist.diary_link_status !== "invalid";

  function openDiaryLink() {
    if (!therapist.diary_link) return;
    window.open(therapist.diary_link, "_blank", "noopener,noreferrer");
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
        }),
      }).catch(() => {});
    }
  }

  if (hasDiaryLink) {
    return (
      <button
        onClick={openDiaryLink}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-600"
      >
        <CalendarClock size={14} /> Choose a date and time <ExternalLink size={12} />
      </button>
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
