"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/database.types";

export default function IntakeMatchFlow({
  entryRoute,
  therapist,
}: {
  entryRoute: string;
  therapist: Tables<"therapists">;
}) {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = therapist.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  if (done) {
    return (
      <div className="rounded-[var(--radius)] bg-accent-soft p-7 text-center">
        <h3 className="mb-1.5 text-xl">You&apos;re all set</h3>
        <p className="text-muted-fg">
          We&apos;ve sent your details to {therapist.full_name}. Check your email — you&apos;ll hear from
          us shortly to set up your first free session.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-7 shadow-soft">
      <div className="mb-5 flex items-center gap-4">
        <div className="relative h-20 w-20 flex-none overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
          {therapist.photo_url ? (
            <Image src={therapist.photo_url} alt={therapist.full_name} fill className="object-cover object-[center_22%]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-semibold text-white">
              {initials}
            </div>
          )}
        </div>
        <div>
          <div className="eyebrow">You&apos;ve been matched with</div>
          <h3 className="mt-0.5 flex items-center gap-1.5 text-lg">
            {therapist.full_name}
            {therapist.is_verified && <BadgeCheck size={16} className="text-primary" />}
          </h3>
          {therapist.short_summary && (
            <p className="mt-0.5 text-[14px] text-muted-fg">{therapist.short_summary}</p>
          )}
        </div>
      </div>

      <form
        className="flex flex-col gap-3.5"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const form = e.currentTarget;
          const data = new FormData(form);
          const payload = {
            entryRoute,
            name: String(data.get("name") ?? ""),
            email: String(data.get("email") ?? ""),
            matchedTherapistId: therapist.id,
            matchedTherapistName: therapist.full_name,
          };
          try {
            const res = await fetch("/api/booking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("failed");
            setDone(true);
          } catch {
            setError("Something went wrong. Please try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Name</label>
            <input
              name="name"
              required
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" block>
          {pending ? "Connecting…" : "Connect me"} <ArrowRight size={16} />
        </Button>
        <p className="text-center text-[13px] text-muted-fg">
          No account needed. Up to six free sessions, always confidential.
        </p>
      </form>
    </div>
  );
}
