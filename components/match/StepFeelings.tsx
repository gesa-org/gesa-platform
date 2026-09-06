"use client";

import { useState } from "react";
import { ArrowLeft, Sparkle, ShieldAlert, Phone } from "lucide-react";
import Button from "@/components/ui/Button";

const MIN_LENGTH = 1;

// Phase 142 — the AI Support wizard's last step before matching: an
// open-text "how are you feeling" field (used only to give the matching
// engine richer context — never shown verbatim to a therapist or included
// in any email; see /api/support-match and /api/support-request/
// select-therapist), plus the crisis disclaimer + emergency-help link
// required for this flow. The CrisisButton in the site header/footer offers
// the same 988/text-line resources in full; this repeats the single most
// urgent one (988) directly here so it's visible without leaving the form.
export default function StepFeelings({
  feelingsText,
  crisisDisclaimerAcknowledged,
  onFeelingsTextChange,
  onCrisisDisclaimerAcknowledgedChange,
  onBack,
  onSubmit,
  submitting,
  submitError,
}: {
  feelingsText: string;
  crisisDisclaimerAcknowledged: boolean;
  onFeelingsTextChange: (value: string) => void;
  onCrisisDisclaimerAcknowledgedChange: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const [touched, setTouched] = useState(false);

  function handleSubmit() {
    setTouched(true);
    onCrisisDisclaimerAcknowledgedChange(true);
    onSubmit();
  }

  return (
    <div>
      <h2 className="mb-1.5 text-[22px]">Express how you are feeling</h2>
      <p className="mb-4 text-muted-fg">
        In your own words — this helps us find the right fit. There&apos;s no right or wrong way to answer, and you
        can be as brief or detailed as you&apos;d like.
      </p>

      <textarea
        value={feelingsText}
        onChange={(e) => onFeelingsTextChange(e.target.value)}
        rows={5}
        placeholder="Share whatever feels relevant right now…"
        className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
      />
      {touched && feelingsText.trim().length < MIN_LENGTH && (
        <p className="mt-1 text-[12.5px] text-muted-fg">Optional — you can leave this blank if you&apos;d rather not share.</p>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/50 p-4 text-[13.5px] text-muted-fg">
        <ShieldAlert size={17} className="mt-0.5 flex-none text-primary" />
        <div>
          <p className="mb-1">
            GESA is not an emergency or crisis service, and this form does not promise a diagnosis, emergency
            intervention, or a guaranteed outcome. If you are in immediate danger or need urgent help right now,
            please contact emergency services or a crisis line directly.
          </p>
          <a
            href="tel:988"
            className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-2"
          >
            <Phone size={13} /> 988 Suicide &amp; Crisis Lifeline — call or text, 24/7
          </a>
        </div>
      </div>

      {submitError && <p className="mt-4 text-sm text-destructive">{submitError}</p>}

      <div className="mt-7 flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Finding your matches…" : "AI Support Match"} <Sparkle size={16} />
        </Button>
      </div>
    </div>
  );
}
