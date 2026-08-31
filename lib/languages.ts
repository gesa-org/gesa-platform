// Shared list for the header LanguageSelector, the account page's language
// field, the accessibility widget's language dropdown, and the translation
// engine. Codes are Google Cloud Translation v2 language codes.
//
// Phase 33 — narrowed from a 38-language spread down to just English and
// Hebrew, per Roy's reference. Phase 90 briefly re-expanded this to a ~51
// language list for the new accessibility widget's Language dropdown, but
// Roy asked immediately after (Phase 91) to put the header/account-page
// dropdown back to just these original two — since this list is shared,
// that reverts the accessibility widget's own Language dropdown back to
// two options as well, rather than forking a second, separate list just
// for that one panel.
export const LANGUAGES = [
  { code: "en", label: "🇺🇸 English", flag: "🇺🇸", name: "English" },
  { code: "he", label: "🇮🇱 עברית", flag: "🇮🇱", name: "עברית" },
];

// Languages that read right-to-left — flips `<html dir>` in
// TranslationProvider.
export const RTL_LANGUAGES = new Set(["he"]);
