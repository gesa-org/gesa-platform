import type { GenderPreference, SessionFormat, Tables } from "@/lib/database.types";

export type WizardAnswers = {
  symptoms: string[];
  treatmentType: string;
  genderPreference: GenderPreference;
  sessionFormat: SessionFormat | null;
  clinicLocationId: string | null;
};

export type TherapistMatch = {
  // Phase 126 — was `contact_phone` directly; the /api/match route no
  // longer sends the raw number to the browser at all (see that route's
  // comment), only this derived boolean.
  therapist: Pick<
    Tables<"therapists">,
    | "id"
    | "full_name"
    | "slug"
    | "photo_url"
    | "specialties"
    | "short_summary"
    | "languages"
    | "gender"
    | "is_verified"
  > & { has_whatsapp: boolean };
  reasoning: string;
};

export const EMPTY_ANSWERS: WizardAnswers = {
  symptoms: [],
  treatmentType: "",
  genderPreference: "no_preference",
  sessionFormat: null,
  clinicLocationId: null,
};
