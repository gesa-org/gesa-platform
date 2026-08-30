"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import IntakeBookingModal from "@/components/intake/IntakeBookingModal";
import type { Tables } from "@/lib/database.types";

type Match = { therapist: Tables<"therapists">; reasoning: string };

// Phase 20 — replaced the old single-random-therapist assignment with a
// short list (up to 3, from the same AI matching engine the Find Your
// Therapist wizard uses) so the client can actually choose who to book
// with, instead of being handed one name with no alternative. Picking a
// card opens IntakeBookingModal, which is where the real
// contact-channel + conflict-free calendar work happens.
export default function IntakeMatchFlow({
  pathKey,
  matches,
  matchListIntro = "Here are volunteer therapists who fit what you shared. Choose one to see their availability and book a free session.",
}: {
  pathKey: string;
  matches: Match[];
  matchListIntro?: string;
}) {
  const [selected, setSelected] = useState<Match | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-[14.5px] text-muted-fg">{matchListIntro}</p>

      {matches.map(({ therapist, reasoning }) => {
        const initials = therapist.full_name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("");

        return (
          <div
            key={therapist.id}
            className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center"
          >
            <div className="relative h-16 w-16 flex-none overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
              {therapist.photo_url ? (
                <Image
                  src={therapist.photo_url}
                  alt={therapist.full_name}
                  fill
                  className="object-cover object-[center_22%]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-xl font-semibold text-white">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="flex items-center gap-1.5 text-[17px]">
                {therapist.full_name}
                {therapist.is_verified && <BadgeCheck size={16} className="text-primary" />}
              </h3>
              <p className="mt-0.5 text-[13.5px] text-muted-fg">{reasoning}</p>
            </div>
            <Button onClick={() => setSelected({ therapist, reasoning })} className="sm:flex-none">
              Choose {therapist.full_name.split(" ")[0]}
            </Button>
          </div>
        );
      })}

      {selected && (
        <IntakeBookingModal
          therapist={selected.therapist}
          pathKey={pathKey}
          onClose={() => setSelected(null)}
          onPickDifferentTherapist={() => setSelected(null)}
        />
      )}
    </div>
  );
}
