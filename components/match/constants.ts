// Phase 143 — the old "Support Needs" symptom-checkbox step (and its
// SYMPTOMS list) was removed entirely as part of shortening the wizard to
// 4 steps; the open-text Feelings step now carries whatever free-text
// signal that step used to provide. StepAssessment.tsx still exists on disk
// but is no longer imported/rendered anywhere — see EXECUTION_PLAN.md.

export const TREATMENT_TYPES = [
  { value: "", label: "No preference" },
  { value: "CBT", label: "Cognitive Behavioral Therapy (CBT)" },
  { value: "Trauma Support", label: "Trauma-informed therapy" },
  { value: "Emotional Support for Couples", label: "Couples / family counseling" },
  { value: "Psychiatry", label: "Psychiatry" },
  { value: "Group Sessions", label: "Group sessions" },
  { value: "Coach (Life Coach)", label: "Life coaching" },
  { value: "Guided Meditation", label: "Holistic / mind-body (meditation, yoga)" },
  { value: "Social Work", label: "Social work / case management" },
];

export const GENDER_OPTIONS: { value: "woman" | "man" | "nonbinary" | "no_preference"; label: string }[] = [
  { value: "woman", label: "Female" },
  { value: "man", label: "Male" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "no_preference", label: "No preference" },
];

export const FORMAT_OPTIONS: { value: "online" | "call" | "in_person"; label: string; description: string }[] = [
  { value: "online", label: "Online", description: "Video session via Zoom" },
  { value: "call", label: "Call", description: "Phone / WhatsApp call" },
  { value: "in_person", label: "In-Person", description: "Meet at a clinic location" },
];

// Phase 142 — a plain-language list, not tied to any therapist's actual
// `languages` array (which is freer-form and partly non-English). Matching
// still fuzzy-matches this against the roster's real language data.
export const LANGUAGE_OPTIONS = [
  "English",
  "Hebrew",
  "Arabic",
  "Russian",
  "French",
  "Spanish",
  "Amharic",
  "Other / no preference",
];
