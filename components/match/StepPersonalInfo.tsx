"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phase 142 — the AI Support wizard's "personal info" step: full name,
// email, phone, an explicit 18+ confirmation, and consent to be contacted
// about this request. Validated on Continue rather than per-keystroke, to
// match this wizard's existing steps (none of which show inline errors
// until the user tries to move on).
export default function StepPersonalInfo({
  fullName,
  email,
  phone,
  ageConfirmed,
  agreedConsent,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
  onAgeConfirmedChange,
  onAgreedConsentChange,
  onBack,
  onNext,
}: {
  fullName: string;
  email: string;
  phone: string;
  ageConfirmed: boolean;
  agreedConsent: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAgeConfirmedChange: (value: boolean) => void;
  onAgreedConsentChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [touched, setTouched] = useState(false);

  const errors = {
    fullName: !fullName.trim() ? "Please enter your name" : null,
    email: !email.trim() || !EMAIL_RE.test(email) ? "Please enter a valid email address" : null,
    ageConfirmed: !ageConfirmed ? "You must confirm you're 18 or older to continue" : null,
    agreedConsent: !agreedConsent ? "Please agree to be contacted about this request" : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function handleNext() {
    setTouched(true);
    if (hasErrors) return;
    onNext();
  }

  return (
    <div>
      <h2 className="mb-1.5 text-[22px]">A little about you</h2>
      <p className="mb-6 text-muted-fg">
        So we can share your matches and, if you choose to move forward, connect you with a therapist.
      </p>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Full name</label>
          <input
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          {touched && errors.fullName && <p className="mt-1 text-[12.5px] text-destructive">{errors.fullName}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          {touched && errors.email && <p className="mt-1 text-[12.5px] text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="mt-3.5">
        <label className="mb-1.5 block text-sm font-semibold">Phone (optional)</label>
        <input
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-[13.5px]">
        <input
          type="checkbox"
          checked={ageConfirmed}
          onChange={(e) => onAgeConfirmedChange(e.target.checked)}
          className="mt-0.5"
        />
        <span>I confirm that I am 18 years of age or older.</span>
      </label>
      {touched && errors.ageConfirmed && <p className="mt-1 text-[12.5px] text-destructive">{errors.ageConfirmed}</p>}

      <label className="mt-3 flex items-start gap-2.5 text-[13.5px]">
        <input
          type="checkbox"
          checked={agreedConsent}
          onChange={(e) => onAgreedConsentChange(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I agree to be contacted by GESA and a matched therapist about this request, in line with GESA&apos;s{" "}
          <a href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {touched && errors.agreedConsent && (
        <p className="mt-1 text-[12.5px] text-destructive">{errors.agreedConsent}</p>
      )}

      <div className="mt-7 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={handleNext}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
