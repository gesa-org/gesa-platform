"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import IntakeBookingModal from "@/components/intake/IntakeBookingModal";
import type { Tables } from "@/lib/database.types";

// "Book a Session" from the Our Therapists directory. Reuses the same
// conflict-free scheduling flow built for the homepage's "Reach out now"
// paths (Phase 20) — real open slots pulled from /api/therapist-availability,
// reserved via /api/intake-booking against a DB-level UNIQUE(therapist_id,
// session_date, session_time) constraint, so a booking made from this page
// gets the exact same double-booking protection and lands in the same
// session_bookings table (visible in the CRM at /admin/sessions). Tagged with
// path "directory" so admins can tell it apart from the homepage entry paths.
export default function BookSessionButton({ therapist }: { therapist: Tables<"therapists"> }) {
  const [open, setOpen] = useState(false);

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
