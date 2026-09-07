"use client";

import { ArrowRight, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { TREATMENT_TYPES, GENDER_OPTIONS, LANGUAGE_OPTIONS } from "@/components/match/constants";
import type { GenderPreference } from "@/lib/database.types";

// Phase 143 — Availability and Accessibility (optional free-text fields)
// were removed per Roy's "shorten and de-duplicate the wizard" request —
// neither fed into actual matching/filtering logic, just stored on the
// support_requests row, so dropping them from the UI is a clean removal
// with no matching-logic impact. This is also now the wizard's first step
// (Support Needs, which used to precede it, was removed entirely), so
// there's no Back button here — nothing behind it to go back to.
export default function StepPreferences({
  treatmentType,
  genderPreference,
  preferredLanguage,
  onTreatmentTypeChange,
  onGenderPreferenceChange,
  onPreferredLanguageChange,
  onNext,
}: {
  treatmentType: string;
  genderPreference: GenderPreference;
  preferredLanguage: string;
  onTreatmentTypeChange: (value: string) => void;
  onGenderPreferenceChange: (value: GenderPreference) => void;
  onPreferredLanguageChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1.5 text-[22px]">Your preferences</h2>
      <p className="mb-6 text-muted-fg">Optional — tell us what you&apos;d prefer, and we&apos;ll do our best to match it.</p>

      {/* Phase 161 — Roy asked for this field's native <select> to become a
          clickable pill/radio interface, matching the gender-preference
          buttons just below it, while keeping the field fully optional, the
          "No preference" default, and the exact same value/onChange contract
          into MatchWizard (still just a plain string — "" for no
          preference, or one of TREATMENT_TYPES' existing values — so
          matching logic, stored data, validation, and step navigation are
          all untouched). Built on real <input type="radio"> elements
          (visually hidden via `sr-only`, one shared `name` so the browser
          itself enforces "only one selected") rather than a hand-rolled
          button group with manual ARIA/roving-tabindex: this gets native
          keyboard support (Tab into the group, arrow keys to move between
          options, Space/click to select), a real accessible name per
          option, and "selecting one option deselects every other" for free,
          all from the platform rather than reimplemented. Each pill's
          visible state (border/background/check icon) is driven by React
          state (`treatmentType === t.value`), same pattern as the existing
          gender-preference buttons — clicking any treatment pill calls
          `onTreatmentTypeChange(t.value)`, which for every option other than
          "No preference" is a non-empty string, and for "No preference"
          itself is `""` — so selecting a treatment type always clears any
          previous "No preference" state and vice versa, since they're
          mutually exclusive values of the same one string. */}
      <fieldset className="mb-6">
        <legend className="mb-1.5 text-sm font-semibold">Preferred treatment type</legend>
        <div role="radiogroup" aria-label="Preferred treatment type" className="flex flex-wrap gap-2.5">
          {TREATMENT_TYPES.map((t) => {
            const checked = treatmentType === t.value;
            return (
              <label
                key={t.value || "no-preference"}
                className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2.5 text-[14px] font-medium transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${
                  checked
                    ? "border-primary bg-accent-soft text-primary"
                    : "border-border bg-card text-foreground hover:border-primary-600"
                }`}
              >
                <input
                  type="radio"
                  name="treatmentType"
                  value={t.value}
                  checked={checked}
                  onChange={() => onTreatmentTypeChange(t.value)}
                  className="sr-only"
                />
                {checked && <Check size={15} aria-hidden="true" />}
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="mb-1.5 block text-sm font-semibold">Therapist gender preference</label>
      <div className="mb-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {GENDER_OPTIONS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => onGenderPreferenceChange(g.value)}
            className={`rounded-xl border px-3 py-2.5 text-[14px] font-medium transition-colors ${
              genderPreference === g.value
                ? "border-primary bg-accent-soft text-primary"
                : "border-border bg-card text-foreground hover:border-primary-600"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <label className="mb-1.5 block text-sm font-semibold">Preferred language</label>
      <select
        value={preferredLanguage}
        onChange={(e) => onPreferredLanguageChange(e.target.value)}
        className="mb-6 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
      >
        <option value="">No preference</option>
        {LANGUAGE_OPTIONS.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      <div className="mt-7 flex items-center justify-end">
        <Button onClick={onNext}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
