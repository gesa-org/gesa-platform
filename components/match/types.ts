import type { GenderPreference, PublicTherapistRow, SessionFormat } from "@/lib/database.types";

// Phase 142 — extended for the "Find Support" AI Support rebuild. Every
// field below is optional-safe (empty string / null / false) so existing
// steps that don't touch the new fields don't need to change their own
// update shape.
export type WizardAnswers = {
  symptoms: string[];
  treatmentType: string;
  genderPreference: GenderPreference;
  preferredLanguage: string;
  availabilityNotes: string;
  accessibilityNeeds: string;
  sessionFormat: SessionFormat | null;
  clinicLocationId: string | null;
  // Step: Your Info
  fullName: string;
  email: string;
  phone: string;
  ageConfirmed: boolean;
  agreedConsent: boolean;
  // Step: How You're Feeling
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
  symptoms: [],
  treatmentType: "",
  genderPreference: "no_preference",
  preferredLanguage: "",
  availabilityNotes: "",
  accessibilityNeeds: "",
  sessionFormat: null,
  clinicLocationId: null,
  fullName: "",
  email: "",
  phone: "",
  ageConfirmed: false,
  agreedConsent: false,
  feelingsText: "",
  crisisDisclaimerAcknowledged: false,
};
