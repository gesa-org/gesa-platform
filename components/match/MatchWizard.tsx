"use client";

import { useState } from "react";
import StepAssessment from "@/components/match/StepAssessment";
import StepPreferences from "@/components/match/StepPreferences";
import StepFormatLocation from "@/components/match/StepFormatLocation";
import StepMatches from "@/components/match/StepMatches";
import BookingModal from "@/components/match/BookingModal";
import { EMPTY_ANSWERS, type WizardAnswers, type TherapistMatch } from "@/components/match/types";
import type { Tables } from "@/lib/database.types";

const STEP_LABELS = ["Assessment", "Preferences", "Format & Location", "Matches"];

export default function MatchWizard({ clinicLocations }: { clinicLocations: Tables<"clinic_locations">[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(EMPTY_ANSWERS);
  const [selectedMatch, setSelectedMatch] = useState<TherapistMatch | null>(null);

  const selectedClinicLocation =
    clinicLocations.find((loc) => loc.id === answers.clinicLocationId) ?? null;

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-8 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-bold ${
                i <= step ? "bg-primary text-white" : "bg-secondary text-muted-fg"
              }`}
            >
              {i + 1}
            </div>
            <span className={`hidden text-[12.5px] font-medium sm:block ${i <= step ? "text-primary" : "text-muted-fg"}`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-soft sm:p-8">
        {step === 0 && (
          <StepAssessment
            selected={answers.symptoms}
            onChange={(symptoms) => setAnswers((a) => ({ ...a, symptoms }))}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepPreferences
            treatmentType={answers.treatmentType}
            genderPreference={answers.genderPreference}
            onTreatmentTypeChange={(treatmentType) => setAnswers((a) => ({ ...a, treatmentType }))}
            onGenderPreferenceChange={(genderPreference) => setAnswers((a) => ({ ...a, genderPreference }))}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepFormatLocation
            sessionFormat={answers.sessionFormat}
            clinicLocationId={answers.clinicLocationId}
            clinicLocations={clinicLocations}
            onFormatChange={(sessionFormat) => setAnswers((a) => ({ ...a, sessionFormat }))}
            onClinicLocationChange={(clinicLocationId) => setAnswers((a) => ({ ...a, clinicLocationId }))}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepMatches answers={answers} onBack={() => setStep(2)} onSelectTherapist={setSelectedMatch} />
        )}
      </div>

      {selectedMatch && (
        <BookingModal
          match={selectedMatch}
          answers={answers}
          clinicLocation={selectedClinicLocation}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
