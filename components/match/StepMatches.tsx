"use client";

import Image from "next/image";
import { ArrowLeft, BadgeCheck, Sparkle, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import BookSessionButton from "@/components/therapists/BookSessionButton";
import { GENDER_OPTIONS, TREATMENT_TYPES } from "@/components/match/constants";
import type { WizardAnswers, TherapistMatch } from "@/components/match/types";

// Phase 59 — labels for the chips summarizing what was actually applied to
// this search, so a client can see at a glance what they asked for instead
// of only inferring it from the therapists shown.
const GENDER_LABELS = Object.fromEntries(GENDER_OPTIONS.map((g) => [g.value, g.label]));
const TREATMENT_LABELS = Object.fromEntries(TREATMENT_TYPES.map((t) => [t.value, t.label]));

// Phase 142 — this step used to fetch /api/match itself and manage its own
// booking modal. Matching now happens once, at the "AI Support Match" submit
// in MatchWizard (so the result can be tied to that same support_requests
// row), and booking now reuses the same <BookSessionButton> the Our
// Professionals directory uses (diary-link vs native, full self-report
// scheduling flow) instead of a separate, narrower booking form — so this
// component is now purely presentational: props in, therapist-selection
// callback out.
export default function StepMatches({
  answers,
  matches,
  matchError,
  genderPreferenceHonored,
  supportRequestId,
  onBack,
  onTherapistSelected,
}: {
  answers: WizardAnswers;
  matches: TherapistMatch[] | null;
  matchError: boolean;
  genderPreferenceHonored: boolean;
  supportRequestId: string | null;
  onBack: () => void;
  onTherapistSelected: (match: TherapistMatch) => void;
}) {
  return (
    <div>
      <h2 className="mb-1.5 flex items-center gap-2 text-[22px]">
        <Sparkle size={19} className="text-primary" /> Your matches
      </h2>
      <p className="mb-3 text-muted-fg">Based on what you shared, here are the therapists we think could be a good fit.</p>
      <p className="mb-4 text-[12.5px] text-muted-fg">
        These suggestions come from an automated match, not a clinical assessment — you choose who, if anyone, to
        reach out to.
      </p>

      {(answers.genderPreference !== "no_preference" || answers.treatmentType) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {answers.genderPreference !== "no_preference" && (
            <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground">
              Preferred gender: {GENDER_LABELS[answers.genderPreference] ?? answers.genderPreference}
            </span>
          )}
          {answers.treatmentType && (
            <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground">
              Treatment: {TREATMENT_LABELS[answers.treatmentType] ?? answers.treatmentType}
            </span>
          )}
          {answers.preferredLanguage && (
            <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground">
              Language: {answers.preferredLanguage}
            </span>
          )}
        </div>
      )}

      {!matchError &&
        matches !== null &&
        matches.length > 0 &&
        answers.genderPreference !== "no_preference" &&
        !genderPreferenceHonored && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/50 p-4 text-[13.5px] text-muted-fg">
            <Info size={16} className="mt-0.5 flex-none text-primary" />
            <span>
              We don&apos;t currently have an active, verified therapist matching your preferred gender (
              {GENDER_LABELS[answers.genderPreference] ?? answers.genderPreference}) available — the matches below are
              our closest fit on treatment type and focus areas instead.{" "}
              <a href="/contact" className="font-semibold text-primary">
                Contact us
              </a>{" "}
              if that preference matters to you and we&apos;ll help directly.
            </span>
          </div>
        )}

      {matchError && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 text-[14px] text-muted-fg">
          Something went wrong finding your matches. Please try again, or{" "}
          <a href="/contact" className="font-semibold text-primary">
            contact us directly
          </a>
          .
        </div>
      )}

      {!matchError && matches === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-[var(--radius)] border border-border bg-secondary/50" />
          ))}
        </div>
      )}

      {!matchError && matches !== null && matches.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 text-[14px] text-muted-fg">
          We couldn&apos;t find a match right now. Please{" "}
          <a href="/contact" className="font-semibold text-primary">
            contact our team
          </a>{" "}
          and we&apos;ll help you find the right therapist directly.
        </div>
      )}

      {!matchError && matches !== null && matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((match) => {
            const t = match.therapist;
            const initials = t.full_name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("");
            return (
              <div
                key={t.id}
                className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-5 sm:flex-row sm:items-start"
              >
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
                  {t.photo_url ? (
                    <Image src={t.photo_url} alt={t.full_name} fill className="object-cover object-[center_22%]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-lg font-semibold text-white">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[16px] font-semibold">{t.full_name}</h3>
                    {t.is_verified && <BadgeCheck size={15} className="text-primary" />}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted-fg">
                    {t.gender && t.gender !== "no_preference" ? GENDER_LABELS[t.gender] ?? t.gender : "Gender not specified"}
                    {t.specialties.length > 0 && ` · ${t.specialties.slice(0, 2).join(", ")}`}
                  </p>
                  <p className="mt-0.5 text-[13.5px] italic text-muted-fg">&ldquo;{match.reasoning}&rdquo;</p>
                  <div className="mt-3 max-w-[220px]">
                    <BookSessionButton
                      therapist={t}
                      pathKey="ai-support"
                      supportRequestId={supportRequestId}
                      onFirstInteract={() => onTherapistSelected(match)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-7">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>
    </div>
  );
}
