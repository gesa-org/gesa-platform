"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import TherapistCard from "@/components/TherapistCard";
import type { Tables } from "@/lib/database.types";

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

const GENDER_LABEL: Record<string, string> = {
  woman: "Female",
  man: "Male",
  nonbinary: "Non-binary",
  no_preference: "Prefer not to say",
};

export default function TherapistsDirectory({ therapists }: { therapists: Tables<"therapists">[] }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [lang, setLang] = useState("");
  const [duration, setDuration] = useState("");
  const [gender, setGender] = useState("");

  const roles = useMemo(() => unique(therapists.flatMap((t) => t.specialties)), [therapists]);
  const langs = useMemo(() => unique(therapists.flatMap((t) => t.languages)), [therapists]);
  const durations = useMemo(
    () => unique(therapists.flatMap((t) => t.session_lengths)),
    [therapists]
  );

  const filtered = therapists.filter(
    (t) =>
      (!name || t.full_name.toLowerCase().includes(name.toLowerCase())) &&
      (!role || t.specialties.includes(role)) &&
      (!lang || t.languages.includes(lang)) &&
      (!duration || t.session_lengths.includes(duration as Tables<"therapists">["session_lengths"][number])) &&
      (!gender || t.gender === gender)
  );

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
      <aside className="sticky top-[90px] rounded-[var(--radius)] border border-border bg-card p-6 shadow-soft">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          Search by name
        </label>
        <input
          placeholder="Search…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] focus:border-primary focus:outline-none"
        />

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          Definition of a therapist
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] focus:border-primary focus:outline-none"
        >
          <option value="">Any</option>
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          Language
        </label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] focus:border-primary focus:outline-none"
        >
          <option value="">Any</option>
          {langs.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          Meeting duration
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="mb-4 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] focus:border-primary focus:outline-none"
        >
          <option value="">Any</option>
          {durations.map((d) => (
            <option key={d}>{d} Minutes</option>
          ))}
        </select>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          Gender
        </label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="mb-5 w-full rounded-xl border border-border px-3 py-2.5 text-[15px] focus:border-primary focus:outline-none"
        >
          <option value="">Any</option>
          <option value="woman">Female</option>
          <option value="man">Male</option>
        </select>

        <a
          href="/contact?subject=Volunteer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a8813f]"
        >
          <Users size={16} /> Join us as a therapist
        </a>
      </aside>

      <div>
        <div className="mb-3.5 text-sm text-muted-fg" aria-live="polite">
          {filtered.length ? `Showing ${filtered.length} of ${therapists.length} therapists` : ""}
        </div>
        {filtered.length ? (
          <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TherapistCard key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] border border-border bg-card p-7 text-muted-fg">
            No therapists match your search right now. Try clearing a filter, or contact us and
            we&apos;ll help you find the right person.
          </div>
        )}
      </div>
    </div>
  );
}
