"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, BadgeCheck, Sparkle, Info, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import BookSessionButton from "@/components/therapists/BookSessionButton";
import { GENDER_OPTIONS, TREATMENT_TYPES } from "@/components/match/constants";
import type { WizardAnswers, TherapistMatch } from "@/components/match/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
// scheduling flow) instead of a separate, narrower booking form.
//
// Phase 143 — the wizard's old, separate "Your Info" step was removed;
// name/email/(optional) phone/consent now live in a compact "Contact
// Details" section right here, gating each match card's booking button
// until they're filled in — the one place this information is actually
// needed (to share the request / request an introduction), rather than
// asked for a step earlier than necessary.
export default function StepMatches({
  answers,
  matches,
  matchError,
  genderPreferenceHonored,
  supportRequestId,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
  onAgreedConsentChange,
  onBack,
  onTherapistSelected,
}: {
  answers: WizardAnswers;
  matches: TherapistMatch[] | null;
  matchError: boolean;
  genderPreferenceHonored: boolean;
  supportRequestId: string | null;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAgreedConsentChange: (value: boolean) => void;
  onBack: () => void;
  onTherapistSelected: (match: TherapistMatch) => void;
}) {
  const [touched, setTouched] = useState(false);

  const contactErrors = {
    fullName: !answers.fullName.trim() ? "Please enter your name" : null,
    email: !answers.email.trim() || !EMAIL_RE.test(answers.email) ? "Please enter a valid email address" : null,
    agreedConsent: !answers.agreedConsent ? "Please agree to be contacted about this request" : null,
  };
  const contactValid = !Object.values(contactErrors).some(Boolean);

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
        <>
          <div className="mb-5 rounded-xl border border-border bg-secondary/50 p-4">
            <h3 className="mb-1 text-[14.5px] font-semibold">Your contact details</h3>
            <p className="mb-3 text-[12.5px] text-muted-fg">
              So we can share this request with whoever you choose below.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <input
                  value={answers.fullName}
                  onChange={(e) => onFullNameChange(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
                {touched && contactErrors.fullName && (
                  <p className="mt-1 text-[12px] text-destructive">{contactErrors.fullName}</p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  value={answers.email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 focus:border-primary focus:outline-none"
                />
                {touched && contactErrors.email && (
                  <p className="mt-1 text-[12px] text-destructive">{contactErrors.email}</p>
                )}
              </div>
            </div>
            <input
              value={answers.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="Phone (optional)"
              className="mt-3 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            <label className="mt-3 flex items-start gap-2.5 text-[12.5px]">
              <input
                type="checkbox"
                checked={answers.agreedConsent}
                onChange={(e) => onAgreedConsentChange(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I agree to be contacted by GESA and whoever I select below about this request, in line with GESA&apos;s{" "}
                <a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {touched && contactErrors.agreedConsent && (
              <p className="mt-1 text-[12px] text-destructive">{contactErrors.agreedConsent}</p>
            )}
          </div>

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
                      {contactValid ? (
                        <BookSessionButton
                          therapist={t}
                          pathKey="ai-support"
                          supportRequestId={supportRequestId}
                          onFirstInteract={() => onTherapistSelected(match)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTouched(true)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-[13px] font-semibold text-muted-fg"
                        >
                          <Lock size={13} /> Add contact details above
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-7">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>
    </div>
  );
}
