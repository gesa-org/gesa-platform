"use client";

import { useRef, useState } from "react";
import StepPreferences from "@/components/match/StepPreferences";
import StepFormatLocation from "@/components/match/StepFormatLocation";
import StepFeelings from "@/components/match/StepFeelings";
import StepMatches from "@/components/match/StepMatches";
import { EMPTY_ANSWERS, type WizardAnswers, type TherapistMatch } from "@/components/match/types";
import type { Tables } from "@/lib/database.types";

// Phase 143 — shortened from 6 steps to 4: Roy asked to remove the old
// "Support Needs" and "Your Info" steps entirely (their components,
// StepAssessment.tsx and StepPersonalInfo.tsx, still exist on disk per this
// project's no-delete convention for already-written files, but are no
// longer imported/rendered anywhere in this flow — see EXECUTION_PLAN.md
// Phase 143). Contact details (name/email/phone/consent) moved into a
// compact section on the Matches step itself rather than their own step.
const STEP_LABELS = ["Preferences", "Format & Location", "Feelings", "Matches"];

// Phase 142 — this wizard's journey lives in a single support_requests row,
// updated (not re-created) at each real step: created by /api/support-match
// at the "AI Support Match" submit, then updated again by
// /api/support-request/select-therapist once contact details are filled in
// and a match card's booking button is first opened.
//
// Phase 184 — this row used to be created the instant a client picked "AI
// Support" on the choice screen (a `useEffect` on mount, POSTing to
// /api/support-pathway) — before any real answer existed. A client who
// opened this wizard and immediately closed the tab still left behind a
// `status: "started"` CRM row with a blank name/email, which the admin
// notification bell and dashboard both surfaced as a real "New Find Support
// request." Worse, ChoiceScreen.tsx *also* logged its own separate
// support_requests row for the same click (its returned id was discarded,
// never reused here), so one "AI Support" click produced two orphaned rows.
// Both are removed: `supportRequestId` now starts `null` and is only ever
// set from the real response of /api/support-match, once the client has
// actually filled in Preferences/Format/Feelings and clicked Submit — the
// first point a genuine, complete answer set exists. See
// EXECUTION_PLAN.md Phase 184 for the full writeup.
export default function MatchWizard({ clinicLocations }: { clinicLocations: Tables<"clinic_locations">[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(EMPTY_ANSWERS);
  const [supportRequestId, setSupportRequestId] = useState<string | null>(null);
  const [matches, setMatches] = useState<TherapistMatch[] | null>(null);
  const [matchError, setMatchError] = useState(false);
  const [genderPreferenceHonored, setGenderPreferenceHonored] = useState(true);
  const [submittingMatch, setSubmittingMatch] = useState(false);
  const selectedTherapistIds = useRef(new Set<string>());

  function update<K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  async function submitForMatches() {
    // Phase 184 — synchronous re-entrancy guard, checked before the button's
    // own `disabled={submitting}` has had a chance to re-render: two rapid
    // clicks in the same tick would otherwise both pass the disabled check
    // and both call this function, each creating its own support_requests
    // row (the API route can't tell them apart — from its side, two calls
    // with no supportRequestId look like two separate submissions).
    if (submittingMatch) return;
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
      // Phase 184 — this response is the first place a real support_requests
      // id ever exists (the route creates the row on this exact call, now
      // that nothing creates it earlier) — captured here, not assumed to
      // already be set, so a retried/resubmitted request reuses the same
      // row instead of the route creating a second one.
      if (data?.supportRequestId) setSupportRequestId(data.supportRequestId as string);
      setMatches(data.matches ?? []);
      setGenderPreferenceHonored(data.genderPreferenceHonored ?? true);
      setStep(3);
    } catch {
      setMatchError(true);
      setStep(3);
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
        // Phase 143 collected name/email/phone/consent on this same step so
        // they could be passed through here at the moment a client picked a
        // therapist. Phase 147 removed that "Your contact details" card
        // from StepMatches entirely (Roy's request) — nothing in this
        // wizard ever sets `answers.fullName`/`email`/`phone`/
        // `agreedConsent` anymore, so these now always send as blank/false.
        // Left wired rather than stripped out, per the no-delete-data
        // convention (WizardAnswers keeps the fields; the API route still
        // accepts and stores them) — flagged to Roy since it means the
        // support_requests row this creates no longer captures real contact
        // info through this path at all.
        fullName: answers.fullName,
        email: answers.email,
        phone: answers.phone || null,
        agreedConsent: answers.agreedConsent,
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
          <StepPreferences
            treatmentType={answers.treatmentType}
            genderPreference={answers.genderPreference}
            preferredLanguage={answers.preferredLanguage}
            onTreatmentTypeChange={(v) => update("treatmentType", v)}
            onGenderPreferenceChange={(v) => update("genderPreference", v)}
            onPreferredLanguageChange={(v) => update("preferredLanguage", v)}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepFormatLocation
            sessionFormat={answers.sessionFormat}
            clinicLocationId={answers.clinicLocationId}
            clinicLocations={clinicLocations}
            onFormatChange={(v) => update("sessionFormat", v)}
            onClinicLocationChange={(v) => update("clinicLocationId", v)}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepFeelings
            feelingsText={answers.feelingsText}
            crisisDisclaimerAcknowledged={answers.crisisDisclaimerAcknowledged}
            onFeelingsTextChange={(v) => update("feelingsText", v)}
            onCrisisDisclaimerAcknowledgedChange={(v) => update("crisisDisclaimerAcknowledged", v)}
            onBack={() => setStep(1)}
            onSubmit={submitForMatches}
            submitting={submittingMatch}
            submitError={null}
          />
        )}
        {step === 3 && (
          <StepMatches
            answers={answers}
            matches={matches}
            matchError={matchError}
            genderPreferenceHonored={genderPreferenceHonored}
            supportRequestId={supportRequestId}
            onBack={() => setStep(2)}
            onTherapistSelected={onTherapistSelected}
          />
        )}
      </div>
    </div>
  );
}
