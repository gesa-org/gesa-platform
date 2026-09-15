// Phase 221 — single centralized source for the two option lists Roy asked
// to be shared across every place a therapist's languages or areas of
// expertise/treatment are picked, displayed, or filtered on: the
// professional onboarding ("JOIN THE MOVEMENT" / VolunteerApplicationModal)
// form's "Possible Therapy Languages" and "Additional Areas of Expertise"
// fields, and the new "Languages"/"Type of Treatment" fields on the Find
// Support page's "Find a professional" search modal (BrowseTherapistModal),
// used by both the Charity Services and Professional Services pathways.
//
// Previously these lists were defined locally inside
// VolunteerApplicationModal.tsx (EXPERTISE_OPTIONS, LANGUAGE_OPTIONS) with
// no shared export — this file extracts them so every consumer imports the
// exact same values, per Roy's explicit "do not create a separate or
// mismatched dataset" instruction.
//
// Roy confirmed (in response to a direct conflict this phase's request
// raised — see EXECUTION_PLAN.md Phase 221) that the onboarding language
// list should be *expanded* to match the comprehensive ~74-item list his
// Find Support spec asked for, rather than the reverse. The previous
// 23-language onboarding list is superseded by the list below — this only
// changes what's selectable going forward; no existing therapist record's
// saved `languages`/`specialties` values are touched by this change (both
// are free-form `text[]` columns, not foreign keys into this list).

// Roy's full ~74-item "comprehensive global language list" (major spoken,
// regional, and sign languages), alphabetized for easier scanning in the
// searchable combobox. This supersedes the old 23-item onboarding list.
export const LANGUAGE_OPTIONS = [
  "Afrikaans",
  "Albanian",
  "Amharic",
  "Arabic",
  "Armenian",
  "ASL (American Sign Language)",
  "Auslan (Australian Sign Language)",
  "Azerbaijani",
  "Bengali",
  "Bosnian",
  "BSL (British Sign Language)",
  "Bulgarian",
  "Cantonese",
  "Croatian",
  "Czech",
  "Danish",
  "Dari",
  "Dutch",
  "English",
  "Estonian",
  "Farsi / Persian",
  "Finnish",
  "French",
  "Georgian",
  "German",
  "Greek",
  "Gujarati",
  "Haitian Creole",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Igbo",
  "Indonesian",
  "International Sign",
  "Irish",
  "Italian",
  "Japanese",
  "Kazakh",
  "Korean",
  "Kurdish",
  "Latvian",
  "Lithuanian",
  "Malay",
  "Malayalam",
  "Mandarin Chinese",
  "Marathi",
  "Mongolian",
  "Nepali",
  "Norwegian",
  "Pashto",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Romanian",
  "Russian",
  "Serbian",
  "Sinhala",
  "Slovak",
  "Somali",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tagalog / Filipino",
  "Tamil",
  "Telugu",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Uzbek",
  "Vietnamese",
  "Welsh",
  "Yoruba",
  "Zulu",
];

// Phase 63/195 — curated master list of areas of expertise/treatment,
// reused for the onboarding form's "Primary Area of Expertise" (single
// select) and "Additional Areas of Expertise" (multi-select combobox)
// fields, and now also for the Find Support search modal's "Type of
// Treatment" field. Unchanged by this phase — this is already the single
// source those two onboarding fields shared, so it's simply moved here and
// re-exported rather than redefined.
export const TREATMENT_OPTIONS = [
  "Art Therapy",
  "Breathing Exercises",
  "CBT",
  "Children and Adolescents",
  "Coach (Life Coach)",
  "Counseling",
  "EMDR",
  "Emotional Support",
  "Emotional Support for Couples",
  "Family Support",
  "Group Sessions",
  "Guided Meditation",
  "Helping The Helper",
  "Herbal Medicine",
  "Homeopathy",
  "Medical Hypnosis",
  "Mindful Self-Compassion",
  "NLP",
  "Pilates",
  "Psychiatry",
  "Psychoanalysis / Psychoanalyst",
  "Psychology",
  "Psychotherapy",
  "Reiki",
  "Social Work",
  "Supervision",
  "Support for Pregnant Women and Infants",
  "ThetaHealing",
  "Trauma Support",
  "Tree of Life Medicine",
  "Yoga",
];

// Labels for each list's "Other" row — kept as named constants (not inline
// strings) since every consumer that needs to recognize "the user picked
// Other" must check the exact same value.
export const OTHER_LANGUAGE_LABEL = "Other language";
export const OTHER_EXPERTISE_LABEL = "Other";
