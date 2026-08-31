// Shared list for the header LanguageSelector, the account page's language
// field, the accessibility widget's language dropdown, and the translation
// engine. Codes are Google Cloud Translation v2 language codes.
//
// Phase 33 — narrowed from a 38-language spread down to just English and
// Hebrew, per Roy's reference. Phase 90 — re-expanded to a broad ~51
// language list per Roy's explicit request, driven by the new accessibility
// widget's "Language" dropdown (see components/accessibility). Every code
// below flows straight into `TranslationProvider`'s existing DOM-translation
// engine (site-wide text walk → lib/translations/he.ts dictionary first,
// then /api/translate → lib/translate.ts → Google Cloud Translation API) —
// nothing here is a cosmetic label with no real behavior behind it. What is
// worth knowing: only English and Hebrew are translated for free/instantly
// (Hebrew via the bundled dictionary, needing no API key at all); every
// other language routes to Google's API, which gracefully no-ops back to
// the original English text if `GOOGLE_TRANSLATE_API_KEY` isn't configured
// in this environment (see lib/translate.ts) — so those languages are
// genuinely wired, but only actually translate once that key is set. Only
// English and Hebrew have a matching SVG flag in FLAG_ICONS
// (components/FlagIcon.tsx) today; every other entry still works
// everywhere `label`/`name` is used (the account page's <select>, this
// widget), just without a flag glyph in the header's icon-first picker —
// FlagIcon's lookup already tolerates a missing entry.
export const LANGUAGES = [
  { code: "en", label: "🇺🇸 English", flag: "🇺🇸", name: "English" },
  { code: "he", label: "🇮🇱 עברית", flag: "🇮🇱", name: "עברית" },
  { code: "ar", label: "🇸🇦 Arabic", flag: "🇸🇦", name: "Arabic" },
  { code: "es", label: "🇪🇸 Spanish", flag: "🇪🇸", name: "Spanish" },
  { code: "fr", label: "🇫🇷 French", flag: "🇫🇷", name: "French" },
  { code: "de", label: "🇩🇪 German", flag: "🇩🇪", name: "German" },
  { code: "it", label: "🇮🇹 Italian", flag: "🇮🇹", name: "Italian" },
  { code: "pt", label: "🇵🇹 Portuguese", flag: "🇵🇹", name: "Portuguese" },
  { code: "ru", label: "🇷🇺 Russian", flag: "🇷🇺", name: "Russian" },
  { code: "uk", label: "🇺🇦 Ukrainian", flag: "🇺🇦", name: "Ukrainian" },
  { code: "pl", label: "🇵🇱 Polish", flag: "🇵🇱", name: "Polish" },
  { code: "nl", label: "🇳🇱 Dutch", flag: "🇳🇱", name: "Dutch" },
  { code: "tr", label: "🇹🇷 Turkish", flag: "🇹🇷", name: "Turkish" },
  { code: "el", label: "🇬🇷 Greek", flag: "🇬🇷", name: "Greek" },
  { code: "ro", label: "🇷🇴 Romanian", flag: "🇷🇴", name: "Romanian" },
  { code: "hu", label: "🇭🇺 Hungarian", flag: "🇭🇺", name: "Hungarian" },
  { code: "sv", label: "🇸🇪 Swedish", flag: "🇸🇪", name: "Swedish" },
  { code: "no", label: "🇳🇴 Norwegian", flag: "🇳🇴", name: "Norwegian" },
  { code: "da", label: "🇩🇰 Danish", flag: "🇩🇰", name: "Danish" },
  { code: "fi", label: "🇫🇮 Finnish", flag: "🇫🇮", name: "Finnish" },
  { code: "cs", label: "🇨🇿 Czech", flag: "🇨🇿", name: "Czech" },
  { code: "sk", label: "🇸🇰 Slovak", flag: "🇸🇰", name: "Slovak" },
  { code: "bg", label: "🇧🇬 Bulgarian", flag: "🇧🇬", name: "Bulgarian" },
  { code: "sr", label: "🇷🇸 Serbian", flag: "🇷🇸", name: "Serbian" },
  { code: "hr", label: "🇭🇷 Croatian", flag: "🇭🇷", name: "Croatian" },
  { code: "sl", label: "🇸🇮 Slovenian", flag: "🇸🇮", name: "Slovenian" },
  { code: "sq", label: "🇦🇱 Albanian", flag: "🇦🇱", name: "Albanian" },
  { code: "lt", label: "🇱🇹 Lithuanian", flag: "🇱🇹", name: "Lithuanian" },
  { code: "lv", label: "🇱🇻 Latvian", flag: "🇱🇻", name: "Latvian" },
  { code: "et", label: "🇪🇪 Estonian", flag: "🇪🇪", name: "Estonian" },
  { code: "hi", label: "🇮🇳 Hindi", flag: "🇮🇳", name: "Hindi" },
  { code: "ur", label: "🇵🇰 Urdu", flag: "🇵🇰", name: "Urdu" },
  { code: "bn", label: "🇧🇩 Bengali", flag: "🇧🇩", name: "Bengali" },
  { code: "pa", label: "🇮🇳 Punjabi", flag: "🇮🇳", name: "Punjabi" },
  { code: "ta", label: "🇮🇳 Tamil", flag: "🇮🇳", name: "Tamil" },
  { code: "te", label: "🇮🇳 Telugu", flag: "🇮🇳", name: "Telugu" },
  { code: "mr", label: "🇮🇳 Marathi", flag: "🇮🇳", name: "Marathi" },
  { code: "gu", label: "🇮🇳 Gujarati", flag: "🇮🇳", name: "Gujarati" },
  { code: "zh-CN", label: "🇨🇳 Chinese (Simplified)", flag: "🇨🇳", name: "Chinese (Simplified)" },
  { code: "zh-TW", label: "🇹🇼 Chinese (Traditional)", flag: "🇹🇼", name: "Chinese (Traditional)" },
  { code: "ja", label: "🇯🇵 Japanese", flag: "🇯🇵", name: "Japanese" },
  { code: "ko", label: "🇰🇷 Korean", flag: "🇰🇷", name: "Korean" },
  { code: "vi", label: "🇻🇳 Vietnamese", flag: "🇻🇳", name: "Vietnamese" },
  { code: "th", label: "🇹🇭 Thai", flag: "🇹🇭", name: "Thai" },
  { code: "id", label: "🇮🇩 Indonesian", flag: "🇮🇩", name: "Indonesian" },
  { code: "ms", label: "🇲🇾 Malay", flag: "🇲🇾", name: "Malay" },
  { code: "tl", label: "🇵🇭 Filipino/Tagalog", flag: "🇵🇭", name: "Filipino/Tagalog" },
  { code: "sw", label: "🇰🇪 Swahili", flag: "🇰🇪", name: "Swahili" },
  { code: "af", label: "🇿🇦 Afrikaans", flag: "🇿🇦", name: "Afrikaans" },
  { code: "fa", label: "🇮🇷 Persian/Farsi", flag: "🇮🇷", name: "Persian/Farsi" },
  { code: "yi", label: "🕎 Yiddish", flag: "🕎", name: "Yiddish" },
];

// Languages that read right-to-left — flips `<html dir>` in
// TranslationProvider. Hebrew, Arabic, Persian, Urdu, and Yiddish (also
// written in Hebrew script) are the RTL entries in the list above; every
// other language stays LTR.
export const RTL_LANGUAGES = new Set(["he", "ar", "fa", "ur", "yi"]);
