// Shared list for the header LanguageSelector, the account page's language
// field, and the translation engine. Codes are Google Cloud Translation
// language codes.
//
// Phase 33 — narrowed from a 38-language spread down to just English and
// Hebrew, per Roy's reference (a similar org's site whose language switcher
// only ever offered these two, with flags in the picker and the page
// flipping to right-to-left when Hebrew is active). Kept as a small array
// rather than a hardcoded pair of variables so the existing selector/account
// page code — which already just maps over this list — needed no changes
// beyond what's in this file and the RTL handling in TranslationProvider.
export const LANGUAGES = [
  { code: "en", label: "🇺🇸 English" },
  { code: "he", label: "🇮🇱 עברית" },
];

// Languages that read right-to-left. Only "he" is reachable from the picker
// today, but keeping this as a set (rather than an `=== "he"` check) means
// adding Arabic or Farsi back later is a one-line change, not a re-audit of
// every place direction is decided.
export const RTL_LANGUAGES = new Set(["he", "ar", "fa", "ur"]);
