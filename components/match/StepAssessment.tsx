// @ts-nocheck
"use client";

// Phase 143 — this component (the old "Support Needs" step) was removed
// from the wizard entirely per Roy's request and is no longer imported
// anywhere (see components/match/MatchWizard.tsx). Left on disk rather
// than deleted per this project's file-removal convention; `@ts-nocheck`
// added since its own SYMPTOMS import no longer exists in constants.ts —
// this file plays no further part in the live app.
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

const SYMPTOMS = [
  "Anxiety",
  "Depression",
  "Grief & loss",
  "Trauma / PTSD",
  "Sleep difficulties",
  "Relationship issues",
  "Family conflict",
  "Anger",
  "Loneliness / isolation",
  "Stress / burnout",
  "Panic attacks",
  "Low self-esteem",
];

export default function StepAssessment({
  selected,
  onChange,
  onNext,
}: {
  selected: string[];
  onChange: (symptoms: string[]) => void;
  onNext: () => void;
}) {
  function toggle(symptom: string) {
    onChange(selected.includes(symptom) ? selected.filter((s) => s !== symptom) : [...selected, symptom]);
  }

  return (
    <div>
      <h2 className="mb-1.5 text-[22px]">What&apos;s bringing you here?</h2>
      <p className="mb-6 text-muted-fg">Select anything that resonates. This helps us find the right fit — pick as many as you&apos;d like.</p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {SYMPTOMS.map((symptom) => {
          const active = selected.includes(symptom);
          return (
            <button
              key={symptom}
              type="button"
              onClick={() => toggle(symptom)}
              className={`rounded-xl border px-4 py-3 text-left text-[14.5px] font-medium transition-colors ${
                active
                  ? "border-primary bg-accent-soft text-primary"
                  : "border-border bg-card text-foreground hover:border-primary-600"
              }`}
            >
              {symptom}
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <span className="text-[13px] text-muted-fg">
          {selected.length > 0 ? `${selected.length} selected` : "Prefer not to say? You can skip this."}
        </span>
        <Button onClick={onNext}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
