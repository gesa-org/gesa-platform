"use client";

import { useEffect, useRef, useState } from "react";
import StepAssessment from "@/components/match/StepAssessment";
import StepPreferences from "@/components/match/StepPreferences";
import StepFormatLocation from "@/components/match/StepFormatLocation";
import StepPersonalInfo from "@/components/match/StepPersonalInfo";
import StepFeelings from "@/components/match/StepFeelings";
import StepMatches from "@/components/match/StepMatches";
import { EMPTY_ANSWERS, type WizardAnswers, type TherapistMatch } from "@/components/match/types";
import type { Tables } from "@/lib/database.types";

const STEP_LABELS = ["Support Needs", "Preferences", "Format & Location", "Your Info", "Feelings", "Matches"];

// Phase 142 — this wizard now creates its own support_requests row (pathway
// "ai") the moment it mounts, i.e. the moment a client picks "AI Support" on
// the choice screen — see /api/support-pathway. Every later step updates
// that same row (via /api/support-match at the "AI Support Match" submit,
// and /api/support-request/select-therapist when a match card's booking
// button is first opened) rather than creating separate records, so the
// whole journey is one CRM row from start to finish.
export default function MatchWizard({ clinicLocations }: { clinicLocations: Tables<"clinic_locations">[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(EMPTY_ANSWERS);
  const [supportRequestId, setSupportRequestId] = useState<string | null>(null);
  const [matches, setMatches] = useState<TherapistMatch[] | null>(null);
  const [matchError, setMatchError] = useState(false);
  const [genderPreferenceHonored, setGenderPreferenceHonored] = useState(true);
  const [submittingMatch, setSubmittingMatch] = useState(false);
  const selectedTherapistIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/support-pathway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathway: "ai" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.id) setSupportRequestId(data.id as string);
      })
      .catch(() => {
        // Non-fatal — the wizard still works end-to-end for the client even
        // if this particular row never got created; it just won't show up
        // in the CRM. Later writes (support-match, select-therapist) simply
        // no-op without a supportRequestId.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  async function submitForMatches() {
    setSubmittingMatch(true);
    setMatchError(false);
    setMatches(null);
    try {
      const res = await fetch("/api/support-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportRequestId, answers }),
      });
      if (!res.ok) throw new Error("match request failed");
      const data = await res.json();
      setMatches(data.matches ?? []);
      setGenderPreferenceHonored(data.genderPreferenceHonored ?? true);
      setStep(5);
    } catch {
      setMatchError(true);
      setStep(5);
    } finally {
      setSubmittingMatch(false);
    }
  }

  function onTherapistSelected(match: TherapistMatch) {
    // BookSessionButton's onFirstInteract can fire more than once per card
    // (e.g. reopening after closing a modal) — only log the first time per
    // therapist per session.
    if (selectedTherapistIds.current.has(match.therapist.id)) return;
    selectedTherapistIds.current.add(match.therapist.id);
    fetch("/api/support-request/select-therapist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supportRequestId,
        therapistId: match.therapist.id,
        therapistName: match.therapist.full_name,
      }),
    }).catch(() => {});
  }

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
            onChange={(symptoms) => update("symptoms", symptoms)}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepPreferences
            treatmentType={answers.treatmentType}
            genderPreference={answers.genderPreference}
            preferredLanguage={answers.preferredLanguage}
            availabilityNotes={answers.availabilityNotes}
            accessibilityNeeds={answers.accessibilityNeeds}
            onTreatmentTypeChange={(v) => update("treatmentType", v)}
            onGenderPreferenceChange={(v) => update("genderPreference", v)}
            onPreferredLanguageChange={(v) => update("preferredLanguage", v)}
            onAvailabilityNotesChange={(v) => update("availabilityNotes", v)}
            onAccessibilityNeedsChange={(v) => update("accessibilityNeeds", v)}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepFormatLocation
            sessionFormat={answers.sessionFormat}
            clinicLocationId={answers.clinicLocationId}
            clinicLocations={clinicLocations}
            onFormatChange={(v) => update("sessionFormat", v)}
            onClinicLocationChange={(v) => update("clinicLocationId", v)}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepPersonalInfo
            fullName={answers.fullName}
            email={answers.email}
            phone={answers.phone}
            ageConfirmed={answers.ageConfirmed}
            agreedConsent={answers.agreedConsent}
            onFullNameChange={(v) => update("fullName", v)}
            onEmailChange={(v) => update("email", v)}
            onPhoneChange={(v) => update("phone", v)}
            onAgeConfirmedChange={(v) => update("ageConfirmed", v)}
            onAgreedConsentChange={(v) => update("agreedConsent", v)}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepFeelings
            feelingsText={answers.feelingsText}
            crisisDisclaimerAcknowledged={answers.crisisDisclaimerAcknowledged}
            onFeelingsTextChange={(v) => update("feelingsText", v)}
            onCrisisDisclaimerAcknowledgedChange={(v) => update("crisisDisclaimerAcknowledged", v)}
            onBack={() => setStep(3)}
            onSubmit={submitForMatches}
            submitting={submittingMatch}
            submitError={null}
          />
        )}
        {step === 5 && (
          <StepMatches
            answers={answers}
            matches={matches}
            matchError={matchError}
            genderPreferenceHonored={genderPreferenceHonored}
            supportRequestId={supportRequestId}
            onBack={() => setStep(4)}
            onTherapistSelected={onTherapistSelected}
          />
        )}
      </div>
    </div>
  );
}
