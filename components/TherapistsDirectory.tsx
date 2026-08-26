"use client";

import { useMemo, useRef, useState } from "react";
import { Users, Search, ChevronDown, Filter } from "lucide-react";
import TherapistCard from "@/components/TherapistCard";
import VolunteerApplyButton from "@/components/volunteer/VolunteerApplyButton";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import type { Tables } from "@/lib/database.types";
import type { TherapistsDirectoryContent } from "@/lib/content";

export const THERAPISTS_DIRECTORY_CONTENT_FALLBACK: TherapistsDirectoryContent = {
  published: true,
  searchLabel: "Search by name",
  searchPlaceholder: "Find therapist…",
  definitionLabel: "Definition of a therapist",
  anyOptionLabel: "Any",
  languageLabel: "Language",
  anyLanguageLabel: "Any language",
  durationLabel: "Meeting duration",
  genderLabel: "Gender",
  maleLabel: "Male",
  femaleLabel: "Female",
  nonbinaryLabel: "Non-binary",
  noPreferenceLabel: "No preference",
  joinAsTherapistLabel: "Join us as a therapist",
  applyFiltersLabel: "Apply filters",
  noResultsMessage:
    "No therapists match your search right now. Try clearing a filter, or contact us and we'll help you find the right person.",
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

// Phase 43 — the "Meeting duration" filter used to be built purely from
// whatever session_lengths values happened to exist across current
// therapist records, so with only 60-minute sessions seeded it showed a
// single "60 min" pill. Roy asked for 45 and 30 min to be selectable too.
// Rather than filter on live data alone (which would silently drop back to
// one option again if the data changed), the pills are now this fixed,
// standard set — unioned with any other real value the data happens to
// contain (so a future 90-min offering still shows up automatically).
const STANDARD_DURATIONS = ["30", "45", "60"];

// Shared pill styling for the radio-style "Definition" list and the
// segmented "Duration"/"Gender" button grids — kept as one function so the
// selected/unselected look stays identical across all three fields.
function optionClass(selected: boolean, extra = "") {
  return `${extra} rounded-full border px-3.5 py-2.5 text-[14px] font-medium transition-colors ${
    selected
      ? "border-clay bg-clay-soft text-primary-600"
      : "border-border text-foreground hover:border-clay"
  }`;
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
        selected ? "border-clay" : "border-border"
      }`}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-clay" />}
    </span>
  );
}

export default function TherapistsDirectory({
  therapists,
  content = THERAPISTS_DIRECTORY_CONTENT_FALLBACK,
}: {
  therapists: Tables<"therapists">[];
  content?: TherapistsDirectoryContent;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [lang, setLang] = useState("");
  const [duration, setDuration] = useState("");
  const [gender, setGender] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const roles = useMemo(() => unique(therapists.flatMap((t) => t.specialties)), [therapists]);
  const langs = useMemo(() => unique(therapists.flatMap((t) => t.languages)), [therapists]);
  const durations = useMemo(() => {
    const fromData = therapists.flatMap((t) => t.session_lengths);
    return Array.from(new Set([...STANDARD_DURATIONS, ...fromData])).sort(
      (a, b) => Number(a) - Number(b)
    );
  }, [therapists]);

  const filtered = therapists.filter(
    (t) =>
      (!name || t.full_name.toLowerCase().includes(name.toLowerCase())) &&
      (!role || t.specialties.includes(role)) &&
      (!lang || t.languages.includes(lang)) &&
      (!duration || t.session_lengths.includes(duration as Tables<"therapists">["session_lengths"][number])) &&
      (!gender || t.gender === gender)
  );

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
      <aside className="sticky top-[90px] rounded-[var(--radius)] border border-border bg-card p-6 shadow-soft">
        {/* Search by name — pill input with a leading icon, matching the new
            filter design Roy supplied. */}
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          {content.searchLabel}
        </label>
        <div className="relative mb-5">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-fg" />
          <input
            placeholder={content.searchPlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border border-border bg-card py-3 pl-10 pr-4 text-[15px] focus:border-primary focus:outline-none"
          />
        </div>

        {/* Definition of a therapist — was a plain <select>, now a vertical
            list of radio-style pills. The option list itself is unchanged
            (still every distinct specialty tag in the real therapist data,
            same filtering logic) — only scrollable with a capped height,
            since that real list runs well past the handful of categories
            shown in the reference image. */}
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          {content.definitionLabel}
        </label>
        <div className="mb-5 flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
          <button type="button" onClick={() => setRole("")} className={optionClass(role === "", "flex items-center gap-2.5 text-left")}>
            <RadioDot selected={role === ""} /> {content.anyOptionLabel}
          </button>
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={optionClass(role === r, "flex items-center gap-2.5 text-left")}
            >
              <RadioDot selected={role === r} /> {r}
            </button>
          ))}
        </div>

        {/* Language — kept as a real <select> (same options, same
            single-value filter behavior as before) with only its visual
            chrome updated: rounded box, no native arrow, custom chevron —
            matching the bordered "field with a dropdown" look in the
            reference rather than the plain browser-default select. */}
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          {content.languageLabel}
        </label>
        <div className="relative mb-5">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-border bg-card px-3.5 py-3 pr-9 text-[15px] focus:border-primary focus:outline-none"
          >
            <option value="">{content.anyLanguageLabel}</option>
            {langs.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-fg" />
        </div>

        {/* Meeting duration — segmented button grid instead of a <select>;
            the option values are the same real session-length data, just
            laid out as tappable pills. Clicking the already-selected one
            deselects it back to "any duration." */}
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          {content.durationLabel}
        </label>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {durations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(duration === d ? "" : d)}
              className={optionClass(duration === d, "text-center")}
            >
              {d} min
            </button>
          ))}
        </div>

        {/* Gender — same segmented style. Phase 43 added a fourth option,
            "No preference" (gender === "no_preference"), which the
            underlying gender_type enum already supported but no button
            here ever exposed — this is a client's own stated gender, not
            the separate "gender_preference" field used elsewhere for match
            requests. */}
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-fg">
          {content.genderLabel}
        </label>
        <div className="mb-5 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setGender(gender === "man" ? "" : "man")}
            className={optionClass(gender === "man", "flex flex-col items-center gap-1 py-2.5")}
          >
            <span className="text-[17px] leading-none">♂</span>
            <span className="text-[11px]">{content.maleLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setGender(gender === "woman" ? "" : "woman")}
            className={optionClass(gender === "woman", "flex flex-col items-center gap-1 py-2.5")}
          >
            <span className="text-[17px] leading-none">♀</span>
            <span className="text-[11px]">{content.femaleLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setGender(gender === "nonbinary" ? "" : "nonbinary")}
            className={optionClass(gender === "nonbinary", "flex flex-col items-center gap-1 py-2.5")}
          >
            <span className="text-[17px] leading-none">⊖</span>
            <span className="text-[11px] leading-tight">{content.nonbinaryLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setGender(gender === "no_preference" ? "" : "no_preference")}
            className={optionClass(gender === "no_preference", "flex flex-col items-center gap-1 py-2.5")}
          >
            <span className="text-[17px] leading-none">✦</span>
            <span className="text-[11px] leading-tight">{content.noPreferenceLabel}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Phase 63 — was a plain link to the generic Contact form; now
              opens the real volunteer therapist application. */}
          <VolunteerApplyButton className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-600">
            <Users size={16} /> {content.joinAsTherapistLabel}
          </VolunteerApplyButton>
          <button
            type="button"
            onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent bg-transparent px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-accent-soft lg:hidden"
          >
            <Filter size={15} /> {content.applyFiltersLabel}
          </button>
        </div>
      </aside>

      <div ref={resultsRef}>
        <div className="mb-3.5 text-sm text-muted-fg" aria-live="polite">
          {filtered.length ? `Showing ${filtered.length} of ${therapists.length} therapists` : ""}
        </div>
        {filtered.length ? (
          <StaggerGroup className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06}>
            {filtered.map((t) => (
              <StaggerItem key={t.id}>
                <TherapistCard t={t} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <div className="rounded-[var(--radius)] border border-border bg-card p-7 text-muted-fg">{content.noResultsMessage}</div>
        )}
      </div>
    </div>
  );
}
