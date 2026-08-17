import type { GenderPreference, SessionFormat, Tables } from "@/lib/database.types";

export type WizardAnswers = {
  symptoms: string[];
  treatmentType: string;
  genderPreference: GenderPreference;
  sessionFormat: SessionFormat | null;
  clinicLocationId: string | null;
};

export type TherapistMatch = {
  therapist: Pick<
    Tables<"therapists">,
    | "id"
    | "full_name"
    | "slug"
    | "photo_url"
    | "specialties"
    | "short_summary"
    | "languages"
    | "is_verified"
    | "contact_phone"
  >;
  reasoning: string;
};

export const EMPTY_ANSWERS: WizardAnswers = {
  symptoms: [],
  treatmentType: "",
  genderPreference: "no_preference",
  sessionFormat: null,
  clinicLocationId: null,
};
