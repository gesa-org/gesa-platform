"use client";

import BrowseTherapistModal from "@/components/find-support/BrowseTherapistModal";
import type { PublicTherapistRow } from "@/lib/database.types";

// Phase 196 — the entry point behind the Community page's "Charity
// Services"/"Professional Services" CTAs (see CommunityIntro.tsx's
// CommunityHeroExtras). Reuses the existing Browse Therapist search modal
// wholesale (per Roy's "reuse existing components... instead of duplicating
// the booking-modal code") rather than building a second search UI —
// `serviceType` is the one thing threaded through, all the way down to
// BookSessionButton, which is where the actual charity-limit/payment
// behavior lives.
//
// Scoped to diary-link therapists only: the Charity/Professional Services
// flow's payment step and 6-session cap are built into the diary-link
// booking chain (BookingIntakeModal -> ... -> ScheduleReviewModal ->
// PaymentModal -> /api/diary-appointment/confirm), which is also the exact
// flow Roy named ("the same booking modal... currently used in the Before
// you book your session modal"). A therapist with no diary_link uses a
// completely different, from-scratch native flow (components/intake/
// IntakeBookingModal.tsx) that was never part of this request and has none
// of the required fields (participation history, sessions count) — rather
// than force those bookings through a mismatched form, they're simply
// excluded from these two entry points' search results.
export default function CommunityServiceModal({
  open,
  onClose,
  therapists,
  serviceType,
}: {
  open: boolean;
  onClose: () => void;
  therapists: PublicTherapistRow[];
  serviceType: "charity" | "professional";
}) {
  const eligibleTherapists = therapists.filter((t) => Boolean(t.diary_link) && t.diary_link_status !== "invalid");

  return (
    <BrowseTherapistModal
      open={open}
      onClose={onClose}
      therapists={eligibleTherapists}
      serviceType={serviceType}
      heading={serviceType === "charity" ? "Find a professional — Charity Services" : "Find a professional — Professional Services"}
      subheading={
        serviceType === "charity"
          ? "Charity Services provide up to 6 free sessions with a GESA professional. If you wish to continue after the sixth session, payment arrangements must be discussed directly with your therapist."
          : "Professional Services are paid sessions. Complete your details, select your appointment, and proceed to secure payment to confirm your booking."
      }
    />
  );
}
