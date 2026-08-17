// Curated for a clean UI. The AI matching call still sees each therapist's
// full real `specialties` list (32 distinct values across the roster, several
// non-English — see EXECUTION_PLAN.md Phase 9 notes) regardless of which of
// these coarser categories the client picks here.
export const SYMPTOMS = [
  "Anxiety",
  "Depression",
  "Grief & loss",
  "Trauma / PTSD",
  "Sleep difficulties",
  "Relationship issues",
  "Family conflict",
  "Anger",
  "Loneliness / isolation",
  "Stress / burnout",
  "Panic attacks",
  "Low self-esteem",
];

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
