"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, BadgeCheck, Sparkle } from "lucide-react";
import Button from "@/components/ui/Button";
import type { WizardAnswers, TherapistMatch } from "@/components/match/types";

export default function StepMatches({
  answers,
  onBack,
  onSelectTherapist,
}: {
  answers: WizardAnswers;
  onBack: () => void;
  onSelectTherapist: (match: TherapistMatch) => void;
}) {
  const [matches, setMatches] = useState<TherapistMatch[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMatches(null);
    setError(false);

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symptoms: answers.symptoms,
        treatmentType: answers.treatmentType || null,
        genderPreference: answers.genderPreference,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("match request failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setMatches(data.matches ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="mb-1.5 flex items-center gap-2 text-[22px]">
        <Sparkle size={19} className="text-primary" /> Your matches
      </h2>
      <p className="mb-6 text-muted-fg">Based on what you shared, here are the therapists we think could be a good fit.</p>

      {error && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 text-[14px] text-muted-fg">
          Something went wrong finding your matches. Please try again, or{" "}
          <a href="/contact" className="font-semibold text-primary">
            contact us directly
          </a>
          .
        </div>
      )}

      {!error && matches === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-[var(--radius)] border border-border bg-secondary/50" />
          ))}
        </div>
      )}

      {!error && matches !== null && matches.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 text-[14px] text-muted-fg">
          We couldn&apos;t find a match right now. Please{" "}
          <a href="/contact" className="font-semibold text-primary">
            contact our team
          </a>{" "}
          and we&apos;ll help you find the right therapist directly.
        </div>
      )}

      {!error && matches !== null && matches.length > 0 && (
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
                className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-5 sm:flex-row sm:items-center"
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
                  <p className="mt-0.5 text-[13.5px] italic text-muted-fg">&ldquo;{match.reasoning}&rdquo;</p>
                </div>
                <Button onClick={() => onSelectTherapist(match)} className="flex-none">
                  Book a Session
                </Button>
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
