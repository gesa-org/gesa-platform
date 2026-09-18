"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users, Search, ChevronDown, Filter, X } from "lucide-react";
import TherapistCard from "@/components/TherapistCard";
import VolunteerApplyButton from "@/components/volunteer/VolunteerApplyButton";
import EditableText from "@/components/ui-builder/public/EditableText";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";
import type { PublicTherapistRow } from "@/lib/database.types";
import type { TherapistsDirectoryContent } from "@/lib/content";
import { shuffleArray } from "@/lib/shuffleArray";
import { getDirectorySpecialtyLabel, isRetiredDirectorySpecialty } from "@/lib/therapistOptions";

const THERAPIST_SHUFFLE_INTERVAL_MS = 60_000;

export const THERAPISTS_DIRECTORY_CONTENT_FALLBACK: TherapistsDirectoryContent = {
  published: true,
  searchLabel: "Search by name",
  searchPlaceholder: "Find Volunteers…",
  definitionLabel: "Definition of a volunteer",
  anyOptionLabel: "Any",
  languageLabel: "Language",
  anyLanguageLabel: "Any language",
  durationLabel: "Meeting duration",
  genderLabel: "Gender",
  maleLabel: "Male",
  femaleLabel: "Female",
  nonbinaryLabel: "Non-binary",
  noPreferenceLabel: "No preference",
  joinAsTherapistLabel: "Join us as a professional",
  applyFiltersLabel: "Apply filters",
  noResultsMessage:
    "No professionals match your search right now. Try clearing a filter, or contact us and we'll help you find the right person.",
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
  pathKey,
  enablePeriodicShuffle = false,
  enableOwnerViewCounts = false,
}: {
  therapists: PublicTherapistRow[];
  content?: TherapistsDirectoryContent;
  // Phase 152 — passed straight through to each TherapistCard when this
  // directory is reused on an intake pathway page (see app/intake/page.tsx)
  // instead of the Our Professionals page. Left undefined by default so
  // TherapistCard falls back to its own "directory" default, unchanged for
  // every other existing caller of this component.
  pathKey?: string;
  /** Enabled on the public directory only; intake flows keep their current order. */
  enablePeriodicShuffle?: boolean;
  /** The public directory opts in; reused pathway directories remain unchanged. */
  enableOwnerViewCounts?: boolean;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [lang, setLang] = useState("");
  const [duration, setDuration] = useState("");
  const [gender, setGender] = useState("");
  // Phase 152 — session-format filter (Online/In-person), using the
  // offers_online/offers_in_person columns added for Browse Therapist
  // search (Phase 151). "" means no filter, same convention as every other
  // field here.
  const [sessionFormat, setSessionFormat] = useState<"" | "online" | "in_person">("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLElement>(null);
  const filterInteractionRef = useRef(false);
  const interactionReleaseTimerRef = useRef<number | null>(null);
  const filtersOpenRef = useRef(false);
  const filteredIdsRef = useRef<Set<string>>(new Set());
  const focusedCardElementRef = useRef<HTMLElement | null>(null);
  const shuffleRequestRef = useRef<() => void>(() => {});
  const [shuffleReady, setShuffleReady] = useState(false);
  const [shuffleRevision, setShuffleRevision] = useState(0);
  const [ownedProfileViews, setOwnedProfileViews] = useState<{ therapistId: string; profileViews: number } | null>(null);

  // Phase 199 (mobile pass) — below `lg` the filter sidebar used to just
  // render inline, full-width, above the results grid: on a phone that
  // pushed every therapist card below several screens' worth of filter
  // controls before a visitor saw a single result. `filtersOpen` now
  // controls a mobile-only bottom-sheet/overlay presentation of the exact
  // same filter fields (same state, same JSX) — at `lg`+ this is unused and
  // the aside renders exactly as it always has (sticky sidebar, no overlay).
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFiltersOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  useEffect(() => {
    filtersOpenRef.current = filtersOpen;
  }, [filtersOpen]);

  useEffect(
    () => () => {
      if (interactionReleaseTimerRef.current !== null) {
        window.clearTimeout(interactionReleaseTimerRef.current);
      }
    },
    []
  );

  // Phase 185 — `?? []` guards added throughout this block: a null
  // specialties/languages/session_lengths column on any one therapist row
  // used to throw here (crashing the whole directory, not just that row)
  // instead of just excluding that row from the affected filter/option
  // list. No active row has a null value today (verified directly against
  // Production), but this was a real, previously-unguarded crash risk —
  // see TherapistCard.tsx's own Phase 185 comment for the sibling fix.
  const roles = useMemo(
    () => unique(therapists.flatMap((t) => t.specialties ?? []).filter((specialty) => !isRetiredDirectorySpecialty(specialty))),
    [therapists]
  );
  const langs = useMemo(() => unique(therapists.flatMap((t) => t.languages ?? [])), [therapists]);
  const durations = useMemo(() => {
    const fromData = therapists.flatMap((t) => t.session_lengths ?? []);
    return Array.from(new Set([...STANDARD_DURATIONS, ...fromData])).sort(
      (a, b) => Number(a) - Number(b)
    );
  }, [therapists]);

  // Filtering always runs against the canonical API result. Shuffling is a
  // later presentation step, so it can never introduce a non-matching card.
  const filtered = useMemo(
    () =>
      therapists.filter(
        (t) =>
          (!name || t.full_name.toLowerCase().includes(name.toLowerCase())) &&
          (!role || (t.specialties ?? []).includes(role)) &&
          (!lang || (t.languages ?? []).includes(lang)) &&
          (!duration || (t.session_lengths ?? []).includes(duration as PublicTherapistRow["session_lengths"][number])) &&
          (!gender || t.gender === gender) &&
          (!sessionFormat || (sessionFormat === "online" ? t.offers_online : t.offers_in_person))
      ),
    [therapists, name, role, lang, duration, gender, sessionFormat]
  );

  useEffect(() => {
    filteredIdsRef.current = new Set(filtered.map((therapist) => therapist.id));
  }, [filtered]);

  useEffect(() => {
    setShuffleReady(enablePeriodicShuffle);
  }, [enablePeriodicShuffle]);

  useEffect(() => {
    if (!enableOwnerViewCounts) return;
    let cancelled = false;
    fetch("/api/analytics/my-profile-views", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { therapistId?: string; profileViews?: number } | null) => {
        if (!cancelled && data?.therapistId && typeof data.profileViews === "number") {
          setOwnedProfileViews({ therapistId: data.therapistId, profileViews: data.profileViews });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enableOwnerViewCounts]);

  const displayedTherapists = useMemo(
    () => (enablePeriodicShuffle && shuffleReady ? shuffleArray(filtered) : filtered),
    [enablePeriodicShuffle, filtered, shuffleReady, shuffleRevision]
  );

  // Capture the exact focused control before a timer-driven reorder. Stable
  // therapist keys preserve its DOM node; this fallback restores it without
  // scrolling if the browser drops focus during the layout update.
  shuffleRequestRef.current = () => {
    const activeElement = document.activeElement;
    const card = activeElement instanceof HTMLElement ? activeElement.closest<HTMLElement>("[data-therapist-id]") : null;
    const therapistId = card?.dataset.therapistId;

    focusedCardElementRef.current = therapistId && filteredIdsRef.current.has(therapistId) && activeElement instanceof HTMLElement
      ? activeElement
      : null;
    setShuffleRevision((revision) => revision + 1);
  };

  useEffect(() => {
    const focusedElement = focusedCardElementRef.current;
    focusedCardElementRef.current = null;
    if (focusedElement && document.contains(focusedElement)) {
      focusedElement.focus({ preventScroll: true });
    }
  }, [shuffleRevision]);

  // One interval for this mounted directory. It deliberately skips hidden
  // tabs, focused filter controls, the mobile filter sheet, and any active
  // modal so a visitor is never interrupted mid-search or booking flow.
  useEffect(() => {
    if (!enablePeriodicShuffle) return;

    const intervalId = window.setInterval(() => {
      const tabIsHidden = document.hidden || document.visibilityState === "hidden";
      const modalIsOpen = Boolean(document.querySelector('[aria-modal="true"]'));
      if (tabIsHidden || filtersOpenRef.current || filterInteractionRef.current || modalIsOpen) return;
      shuffleRequestRef.current();
    }, THERAPIST_SHUFFLE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enablePeriodicShuffle]);

  function beginFilterInteraction() {
    filterInteractionRef.current = true;
  }

  function endFilterInteraction() {
    if (interactionReleaseTimerRef.current !== null) {
      window.clearTimeout(interactionReleaseTimerRef.current);
    }
    interactionReleaseTimerRef.current = window.setTimeout(() => {
      filterInteractionRef.current = Boolean(filterPanelRef.current?.contains(document.activeElement));
      interactionReleaseTimerRef.current = null;
    });
  }

  // Phase 180 — Roy asked for incremental "Load more" pagination to be
  // removed entirely: it was unreliable, and the persistent "Showing X of Y"
  // line could drift from the actual on-screen card count. Every therapist
  // matching the current filters now renders in one pass — `filtered` is
  // already the full, in-memory matching set (see the `.filter()` above),
  // so there is no separate "visible window" to track anymore. A visitor
  // scrolls the full list naturally instead of clicking through pages.
  const hasActiveFilters = Boolean(name || role || lang || duration || gender || sessionFormat);
  const activeFilterCount = [name, role, lang, duration, gender, sessionFormat].filter(Boolean).length;
  const countMessage = filtered.length
    ? hasActiveFilters
      ? `Showing ${filtered.length} of ${therapists.length} active professionals`
      : `Showing all ${therapists.length} active professionals`
    : "No professionals match your current filters.";

  function clearAllFilters() {
    setName("");
    setRole("");
    setLang("");
    setDuration("");
    setGender("");
    setSessionFormat("");
  }

  return (
    <div className="mt-10 lg:grid lg:gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
      {/* Phase 199 (mobile pass) — filter trigger bar, only rendered below
          `lg` (the sticky sidebar below takes over at `lg`+ and this whole
          bar disappears). Shows the active-filter count and a one-tap
          "Clear all" so a visitor can see and reset filter state without
          opening the sheet. */}
      <div className="mb-4 flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Filter size={16} /> Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-fg">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex-none text-[14px] font-semibold text-primary underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <aside
        ref={filterPanelRef}
        onFocusCapture={beginFilterInteraction}
        onBlurCapture={endFilterInteraction}
        className={`${
          filtersOpen
            ? "fixed inset-0 z-[120] flex flex-col bg-[#eef1f6] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
            : "hidden"
        } lg:sticky lg:top-[90px] lg:z-auto lg:block lg:max-h-none lg:overflow-visible lg:rounded-[var(--radius)] lg:border lg:border-border lg:bg-card lg:p-6 lg:shadow-soft`}
      >
        {/* Mobile-only sheet header — not rendered at `lg`+, where the aside
            has no overlay/close affordance at all (it's just the sidebar). */}
        <div className="flex flex-none items-center justify-between border-b border-border px-5 py-4 lg:hidden">
          <span className="text-[15px] font-semibold uppercase tracking-wide text-muted-fg">Filters</span>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:p-0">
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

        {/* Definition of a volunteer — was a plain <select>, now a vertical
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
              <RadioDot selected={role === r} /> {getDirectorySpecialtyLabel(r)}
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

        {/* Phase 152 — session-format filter, using the offers_online/
            offers_in_person columns added for Browse Therapist search
            (Phase 151). Same segmented-pill treatment as Gender above. */}
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-fg">Session format</label>
        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSessionFormat(sessionFormat === "online" ? "" : "online")}
            className={optionClass(sessionFormat === "online", "text-center")}
          >
            Online
          </button>
          <button
            type="button"
            onClick={() => setSessionFormat(sessionFormat === "in_person" ? "" : "in_person")}
            className={optionClass(sessionFormat === "in_person", "text-center")}
          >
            In-person
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Phase 63 — was a plain link to the generic Contact form; now
              opens the real volunteer therapist application. */}
          <VolunteerApplyButton className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-600">
            <Users size={16} /> {content.joinAsTherapistLabel}
          </VolunteerApplyButton>
        </div>
        </div>

        {/* Phase 199 (mobile pass) — mobile-only sticky sheet footer.
            Filters already apply live as each control is tapped (same
            `filtered` state as before), so this button's only job is to
            close the sheet and bring the visitor back to the results —
            it replaces the old "Apply filters" button, which just
            scrolled to the results without ever closing anything. */}
        <div className="flex-none border-t border-border bg-[#eef1f6] px-5 py-4 lg:hidden">
          <button
            type="button"
            onClick={() => {
              setFiltersOpen(false);
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-[15px] font-semibold text-primary-fg transition-colors hover:bg-primary-600"
          >
            Show {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </button>
        </div>
      </aside>

      <div ref={resultsRef}>
        <div className="mb-3.5 text-sm text-muted-fg" aria-live="polite">
          {countMessage}
        </div>
        {displayedTherapists.length ? (
          <StaggerGroup className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06}>
            {displayedTherapists.map((t) => (
              <StaggerItem key={t.id} layout={enablePeriodicShuffle}>
                <TherapistCard
                  t={t}
                  pathKey={pathKey}
                  viewCount={ownedProfileViews?.therapistId === t.id ? ownedProfileViews.profileViews : undefined}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <div className="rounded-[var(--radius)] border border-border bg-card p-7 text-muted-fg">
            <EditableText contentId="therapists.directory.noResultsMessage" label="No-results message" value={content.noResultsMessage} as="span" />
          </div>
        )}
      </div>
    </div>
  );
}
