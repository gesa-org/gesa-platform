"use client";

import { SYMPTOMS } from "@/components/match/constants";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

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
                  : "border-border bg-white text-foreground hover:border-primary-600"
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
