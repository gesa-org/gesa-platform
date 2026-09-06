"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { TREATMENT_TYPES, GENDER_OPTIONS, LANGUAGE_OPTIONS } from "@/components/match/constants";
import type { GenderPreference } from "@/lib/database.types";

export default function StepPreferences({
  treatmentType,
  genderPreference,
  preferredLanguage,
  availabilityNotes,
  accessibilityNeeds,
  onTreatmentTypeChange,
  onGenderPreferenceChange,
  onPreferredLanguageChange,
  onAvailabilityNotesChange,
  onAccessibilityNeedsChange,
  onBack,
  onNext,
}: {
  treatmentType: string;
  genderPreference: GenderPreference;
  preferredLanguage: string;
  availabilityNotes: string;
  accessibilityNeeds: string;
  onTreatmentTypeChange: (value: string) => void;
  onGenderPreferenceChange: (value: GenderPreference) => void;
  onPreferredLanguageChange: (value: string) => void;
  onAvailabilityNotesChange: (value: string) => void;
  onAccessibilityNeedsChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1.5 text-[22px]">Your preferences</h2>
      <p className="mb-6 text-muted-fg">Optional — tell us what you&apos;d prefer, and we&apos;ll do our best to match it.</p>

      <label className="mb-1.5 block text-sm font-semibold">Preferred treatment type</label>
      <select
        value={treatmentType}
        onChange={(e) => onTreatmentTypeChange(e.target.value)}
        className="mb-6 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
      >
        {TREATMENT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

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

      <label className="mb-1.5 block text-sm font-semibold">Availability (optional)</label>
      <input
        value={availabilityNotes}
        onChange={(e) => onAvailabilityNotesChange(e.target.value)}
        placeholder="e.g. weekday evenings, weekend mornings"
        className="mb-6 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
      />

      <label className="mb-1.5 block text-sm font-semibold">Accessibility needs (optional)</label>
      <input
        value={accessibilityNeeds}
        onChange={(e) => onAccessibilityNeedsChange(e.target.value)}
        placeholder="Anything that would help a session work better for you"
        className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
      />

      <div className="mt-7 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={onNext}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
