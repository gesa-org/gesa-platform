"use client";

import { useTranslation } from "@/components/TranslationProvider";
import { LANGUAGES } from "@/lib/languages";

// Phase 90 — genuinely wired to the site's real i18n system: selecting a
// language here calls the exact same `setLanguage()` the header's own
// LanguageSelector uses (components/TranslationProvider.tsx), so it's the
// real translation engine, not a cosmetic label. See lib/languages.ts's own
// comment for what's translated instantly (English/Hebrew) vs. what depends
// on GOOGLE_TRANSLATE_API_KEY being configured (every other language).
export default function LanguageSection() {
  const { language, translating, setLanguage } = useTranslation();

  return (
    <section aria-labelledby="a11y-language-heading" className="a11y-panel-section">
      <h3 id="a11y-language-heading" className="a11y-panel-section-heading">
        Language
      </h3>
      <label htmlFor="a11y-language-select" className="a11y-visually-hidden">
        Website language
      </label>
      <select
        id="a11y-language-select"
        className="a11y-select"
        value={language}
        disabled={translating}
        onChange={(e) => setLanguage(e.target.value)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
      {translating && (
        <p className="a11y-panel-hint" role="status">
          Translating page…
        </p>
      )}
    </section>
  );
}
