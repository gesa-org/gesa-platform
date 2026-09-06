import type { GenderPreference, PublicTherapistRow, SessionFormat } from "@/lib/database.types";

// Phase 143 — shortened to 4 steps (Preferences, Format & Location,
// Feelings, Matches). Removed entirely, per Roy's request: symptoms (the
// old "Support Needs" step), availabilityNotes/accessibilityNeeds (unused
// by matching, just stored), and ageConfirmed (the old "Your Info" step's
// 18+ gate — dropped along with that step, not preserved elsewhere; see
// EXECUTION_PLAN.md Phase 143 for the explicit disclosure on this).
// fullName/email/phone/agreedConsent survive, but move from their own step
// into a compact "Contact Details" section on the Matches step itself.
export type WizardAnswers = {
  treatmentType: string;
  genderPreference: GenderPreference;
  preferredLanguage: string;
  sessionFormat: SessionFormat | null;
  clinicLocationId: string | null;
  // Contact Details — collected on the Matches step, not a separate step.
  fullName: string;
  email: string;
  phone: string;
  agreedConsent: boolean;
  // Step: Feelings
  feelingsText: string;
  crisisDisclaimerAcknowledged: boolean;
};

export type TherapistMatch = {
  // Phase 126 — was `contact_phone` directly; the /api/support-match route
  // no longer sends the raw number to the browser at all (see that route's
  // comment), only this derived boolean.
  // Phase 142 — widened from a narrow Pick to the full PublicTherapistRow
  // (adds slug/diary_link/diary_link_status/etc.) so match results can be
  // handed straight to the existing <BookSessionButton> component instead of
  // a separate, narrower booking flow.
  therapist: PublicTherapistRow;
  reasoning: string;
};

export const EMPTY_ANSWERS: WizardAnswers = {
  treatmentType: "",
  genderPreference: "no_preference",
  preferredLanguage: "",
  sessionFormat: null,
  clinicLocationId: null,
  fullName: "",
  email: "",
  phone: "",
  agreedConsent: false,
  feelingsText: "",
  crisisDisclaimerAcknowledged: false,
};
