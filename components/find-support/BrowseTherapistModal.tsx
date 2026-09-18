"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Globe2, MapPin, Search, ArrowLeft, BadgeCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import BookSessionButton from "@/components/therapists/BookSessionButton";
import MultiSelectCombobox from "@/components/ui/MultiSelectCombobox";
import {
  LANGUAGE_OPTIONS,
  TREATMENT_OPTIONS,
  OTHER_LANGUAGE_LABEL,
  OTHER_EXPERTISE_LABEL,
} from "@/lib/therapistOptions";
import {
  searchTherapists,
  validateBrowseSearch,
  isBrowseSearchValid,
  type BrowseSessionType,
  type BrowseSearchResult,
} from "@/lib/browseTherapistSearch";
import type { PublicTherapistRow } from "@/lib/database.types";

// Phase 221 — resolves a combobox's selected values into the actual strings
// to search/match with: if the "Other" row is selected and its free-text
// field has a value, that literal option label (e.g. "Other language") is
// swapped for the typed text (e.g. "Yiddish") so matching runs against what
// the user actually means, not the placeholder label. See
// lib/browseTherapistSearch.ts's own normalize() comment for how this lines
// up with how therapist records store their own "Other" picks.
function effectiveSelections(selected: string[], otherLabel: string, otherText: string): string[] {
  const trimmedOther = otherText.trim();
  if (!trimmedOther || !selected.includes(otherLabel)) return selected;
  return selected.map((v) => (v === otherLabel ? trimmedOther : v));
}

// Phase 151 — the guided search behind the Find Support page's "Browse
// therapist" option (see components/find-support/ChoiceScreen.tsx). Two
// internal steps ("search" then "results"), both inside this one modal —
// there's no separate page/route for this flow, matching the existing
// AI Support wizard's own single-modal pattern (FindSupportModal).
//
// z-index: deliberately z-[85], one step BELOW the shared booking Modal
// component's z-[90] (components/ui/Modal.tsx, used by every step of
// BookSessionButton's own flows) rather than matching FindSupportModal's
// z-[100]. That's a deliberate choice, not an oversight — with this modal
// below the booking modal's own z-index, clicking "Book a session"/"Choose
// a date and time" on a result card lets the real booking flow open
// naturally on top, fully usable, with no need to hide or unmount this
// modal first. See EXECUTION_PLAN.md Phase 151 for the "avoid nested modal
// issues" writeup, including the pre-existing case this deliberately avoids
// repeating.
const MODAL_Z = "z-[85]";

// Reused from the Our Professionals directory pattern (TherapistsDirectory/
// TherapistCard) for the availability-format badges — same two-letter
// glyphs aren't used, just the same icon choices (Globe2 for online,
// MapPin for in-person) so this reads as the same visual language.
function FormatBadge({ icon: Icon, label }: { icon: typeof Globe2; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11.5px] font-medium text-muted-fg">
      <Icon size={12} className="flex-none" /> {label}
    </span>
  );
}

function ResultCard({
  result,
  sessionType,
  serviceType,
}: {
  result: BrowseSearchResult;
  sessionType: BrowseSessionType;
  // Phase 196 — see BrowseTherapistModal's own prop comment below.
  serviceType?: "charity" | "professional";
}) {
  const t = result.therapist;
  const initials = t.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent">
      <Link href={`/therapists/${t.slug}`} className="contents">
        <div className="relative aspect-square w-full flex-none overflow-hidden bg-gradient-to-br from-primary to-accent">
          {t.photo_url ? (
            <Image
              src={t.photo_url}
              alt={t.full_name}
              fill
              className="object-cover object-[center_22%]"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-[52px] font-semibold text-white">
              {initials}
            </div>
          )}
          {t.is_verified && (
            <span className="absolute right-2.5 top-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e3e8ef]/90 text-primary shadow-soft">
              <BadgeCheck size={17} />
            </span>
          )}
        </div>
        <div className="flex-1 px-[18px] pb-1 pt-4">
          <h3 className="text-base font-semibold">{t.full_name}</h3>
          <div className="mb-1 text-[13px] font-medium text-primary">{t.specialties?.[0] ?? ""}</div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {t.offers_online && <FormatBadge icon={Globe2} label="Online" />}
            {t.offers_in_person && <FormatBadge icon={MapPin} label="In-person" />}
          </div>
          {(t.city || t.country) && (
            <div className="mb-2 flex items-center gap-1 text-[12px] text-muted-fg">
              <MapPin size={12} className="flex-none" aria-hidden="true" />
              {[t.city, t.country].filter(Boolean).join(", ")}
              {/* Phase 151 — distance is only ever rendered when a real
                  coordinate-based value exists (see
                  lib/browseTherapistSearch.ts's own comment on why that's
                  always null today) — never estimated or implied from
                  country/city text matching alone. */}
              {result.distanceKm !== null && <span> · {Math.round(result.distanceKm)} km away</span>}
            </div>
          )}
          <p className="mb-3 line-clamp-2 text-[13.5px] text-muted-fg">{t.short_summary}</p>
          {t.languages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {t.languages.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11.5px] font-medium text-muted-fg"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-col gap-1.5 px-[18px] pb-3 pt-2">
        {/* Phase 221 — bookingMetadata.country/cityOrAddress are no longer
            collected by this search (see BrowseTherapistModal's own Phase
            221 comment), so they're passed empty rather than repurposed to
            carry language/treatment data — the CRM's search_country/
            search_city_or_address columns would otherwise show misleading
            values under their existing labels. Flagged in EXECUTION_PLAN.md
            as a follow-up: a proper search_languages/search_treatment_types
            migration would be needed to keep this analytics tag accurate. */}
        <BookSessionButton
          therapist={t}
          ctaLabel="Book a session"
          bookingMetadata={{
            sessionType,
            country: "",
            cityOrAddress: null,
          }}
          serviceType={serviceType}
        />
        <Link
          href={`/therapists/${t.slug}`}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary"
        >
          View profile
        </Link>
      </div>
    </div>
  );
}

export default function BrowseTherapistModal({
  open,
  onClose,
  therapists,
  serviceType,
  heading,
  subheading,
}: {
  open: boolean;
  onClose: () => void;
  therapists: PublicTherapistRow[];
  // Phase 196 — set only when this search is opened from the Community
  // page's Charity Services / Professional Services CTAs (see
  // components/support-groups/CommunityServiceModal.tsx). Threaded straight
  // through to BookSessionButton for every result, which handles the actual
  // charity-limit/payment behavior — this modal itself doesn't need to know
  // any more than "which flavor of booking should the result cards start."
  serviceType?: "charity" | "professional";
  // Phase 196 — optional copy override so the same search UI can read
  // "Find a professional for Charity Services" instead of the generic
  // "Find a therapist" when opened from one of the two new entry points.
  heading?: string;
  subheading?: string;
}) {
  const [step, setStep] = useState<"search" | "results">("search");
  const [sessionType, setSessionType] = useState<BrowseSessionType | null>(null);
  // Phase 221 — Languages (required) and Type of Treatment (optional,
  // "No preference" when empty) replace the old country/cityOrAddress
  // fields. Each has its own "Other" free-text companion, same pattern as
  // the onboarding form's identical fields (see MultiSelectCombobox).
  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLanguage, setOtherLanguage] = useState("");
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>([]);
  const [otherTreatment, setOtherTreatment] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BrowseSearchResult[] | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errors = useMemo(
    () => (attempted ? validateBrowseSearch({ sessionType, languages, treatmentTypes }) : {}),
    [attempted, sessionType, languages, treatmentTypes]
  );

  // Reset to a fresh search every time this modal is freshly opened (not on
  // every render) — reopening "Browse therapist" after fully closing should
  // start clean, while going back-and-forth between "search" and "results"
  // within a single open session keeps the client's selections (the spec's
  // own "Change search... retaining the user's previous selections").
  useEffect(() => {
    if (open) {
      setStep("search");
      setSessionType(null);
      setLanguages([]);
      setOtherLanguage("");
      setTreatmentTypes([]);
      setOtherTreatment("");
      setAttempted(false);
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog as soon as it opens, same intent as every
    // other modal on this site (FindSupportModal doesn't do this today, but
    // Modal.tsx's portal-based modals get native focus behavior for free —
    // this one doesn't use a portal, so it's done explicitly here).
    const toFocus = dialogRef.current?.querySelector<HTMLElement>("input, button");
    toFocus?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  if (!open) return null;

  // Phase 221 — the values actually used for validation/matching/display:
  // any selected "Other" option is resolved to its typed free text (see
  // effectiveSelections above this component).
  const effectiveLanguages = effectiveSelections(languages, OTHER_LANGUAGE_LABEL, otherLanguage);
  const effectiveTreatmentTypes = effectiveSelections(treatmentTypes, OTHER_EXPERTISE_LABEL, otherTreatment);

  function runSearch() {
    setAttempted(true);
    const criteria = { sessionType, languages: effectiveLanguages, treatmentTypes: effectiveTreatmentTypes };
    const validation = validateBrowseSearch(criteria);
    if (Object.keys(validation).length > 0 || !sessionType) return;
    setSearching(true);
    // Phase 151 — this "search" runs against therapists already fetched by
    // the page (the same list Our Professionals uses), not a live network
    // request, so there's nothing to actually await. A short, deliberate
    // delay keeps the "Finding therapists…" loading state the spec asked
    // for from flashing by unreadably fast, rather than faking a network
    // round-trip that doesn't exist.
    searchTimeoutRef.current = setTimeout(() => {
      setResults(
        searchTherapists(therapists, {
          sessionType,
          languages: effectiveLanguages,
          treatmentTypes: effectiveTreatmentTypes,
        })
      );
      setSearching(false);
      setStep("results");
    }, 300);
  }

  function changeSearch() {
    setStep("search");
    setResults(null);
  }

  function browseAllProfessionals() {
    const params = new URLSearchParams();
    if (sessionType) params.set("sessionType", sessionType);
    effectiveLanguages.forEach((l) => params.append("language", l));
    effectiveTreatmentTypes.forEach((t) => params.append("treatmentType", t));
    onClose();
    window.location.href = `/therapists?${params.toString()}`;
  }

  const resultCountLabel =
    results !== null ? `${results.length} therapist${results.length === 1 ? "" : "s"} found` : "";

  return (
    <div
      className={`fixed inset-0 ${MODAL_Z} flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-16 sm:py-24`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Find a therapist"
    >
      {/* Shared Sand Grey modal background, matching every other form
          modal site-wide (see components/ui/Modal.tsx's own Phase 220
          comment and app/globals.css's --sand-grey). This is the booking
          dialog's own panel; the therapist result cards above in this same
          file (`bg-card` on the grid) are page content, not modal chrome,
          so they're deliberately left unchanged. */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-[880px] rounded-2xl bg-sand-grey p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-fg hover:bg-secondary"
        >
          <X size={18} />
        </button>

        <div className="max-h-[80vh] overflow-y-auto pt-2">
          {step === "search" && (
            <div className="mx-auto max-w-[680px]">
              <h2 className="mb-1.5 text-[22px]">{heading ?? "Find a therapist"}</h2>
              <p className="mb-6 text-muted-fg">
                {subheading ?? "Choose how and where you would like to receive support."}
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Type of session <span className="text-destructive">*</span>
                  </label>
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSessionType("online")}
                      aria-pressed={sessionType === "online"}
                      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-left transition-colors ${
                        sessionType === "online"
                          ? "border-primary bg-accent-soft"
                          : "border-border bg-card hover:border-primary-600"
                      }`}
                    >
                      <Globe2 size={17} className="mt-0.5 flex-none text-primary" />
                      <span>
                        <span className="block text-[14.5px] font-semibold text-foreground">Online</span>
                        <span className="block text-[12.5px] text-muted-fg">
                          Meet securely from wherever you are.
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionType("in_person")}
                      aria-pressed={sessionType === "in_person"}
                      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-left transition-colors ${
                        sessionType === "in_person"
                          ? "border-primary bg-accent-soft"
                          : "border-border bg-card hover:border-primary-600"
                      }`}
                    >
                      <MapPin size={17} className="mt-0.5 flex-none text-primary" />
                      <span>
                        <span className="block text-[14.5px] font-semibold text-foreground">In-person</span>
                        <span className="block text-[12.5px] text-muted-fg">
                          Meet face-to-face at a location arranged with your therapist.
                        </span>
                      </span>
                    </button>
                  </div>
                  {errors.sessionType && <p className="mt-1.5 text-[12.5px] text-destructive">{errors.sessionType}</p>}
                </div>

                {/* Phase 221 — Location (Country) and City/address replaced
                    with therapist-matching fields, per Roy's spec: Languages
                    (required, matches against a therapist's own `languages`)
                    and Type of Treatment (optional — an empty selection
                    means "No preference" and applies no filter — matching
                    against `specialties`). Both share the exact same option
                    lists as the professional onboarding form's "Possible
                    Therapy Languages"/"Additional Areas of Expertise" fields
                    (lib/therapistOptions.ts) and reuse that same searchable,
                    chip-based MultiSelectCombobox control. */}
                <div className="flex flex-col gap-5">
                  <MultiSelectCombobox
                    id="browse-languages"
                    label="Languages"
                    required
                    helperText="Select every language you'd be comfortable having your session in."
                    placeholder="Search languages…"
                    options={LANGUAGE_OPTIONS}
                    value={languages}
                    onChange={setLanguages}
                    otherOptionLabel={OTHER_LANGUAGE_LABEL}
                    otherFieldLabel="Please specify other language."
                    otherFieldPlaceholder="e.g. Yiddish"
                    otherValue={otherLanguage}
                    onOtherValueChange={setOtherLanguage}
                    error={errors.languages}
                  />
                  <MultiSelectCombobox
                    id="browse-treatment"
                    label="Type of Treatment"
                    helperText="Optional — leave blank for No preference."
                    placeholder="No preference…"
                    options={TREATMENT_OPTIONS}
                    value={treatmentTypes}
                    onChange={setTreatmentTypes}
                    otherOptionLabel={OTHER_EXPERTISE_LABEL}
                    otherFieldLabel="Please specify other treatment type."
                    otherFieldPlaceholder="e.g. Somatic Therapy"
                    otherValue={otherTreatment}
                    onOtherValueChange={setOtherTreatment}
                  />
                </div>
              </div>

              <div className="mt-7">
                <Button
                  onClick={runSearch}
                  disabled={
                    searching ||
                    !isBrowseSearchValid({ sessionType, languages: effectiveLanguages, treatmentTypes: effectiveTreatmentTypes })
                  }
                  block
                >
                  <Search size={16} /> {searching ? "Finding therapists…" : "Start browsing therapists"}
                </Button>
              </div>
            </div>
          )}

          {step === "results" && results !== null && (
            <div>
              <button
                type="button"
                onClick={changeSearch}
                className="mb-3 flex items-center gap-1 text-[13px] font-semibold text-muted-fg hover:text-primary"
              >
                <ArrowLeft size={14} /> Change search
              </button>

              <h2 className="mb-1 text-[20px]">
                Therapists who speak {effectiveLanguages.join(", ")}
              </h2>
              <p className="mb-3 text-[13.5px] text-muted-fg" aria-live="polite">
                {resultCountLabel}
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground">
                  {sessionType === "online" ? "Online" : "In-person"}
                </span>
                {effectiveLanguages.map((l) => (
                  <span
                    key={l}
                    className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground"
                  >
                    {l}
                  </span>
                ))}
                {effectiveTreatmentTypes.length === 0 ? (
                  <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground">
                    No preference (treatment)
                  </span>
                ) : (
                  effectiveTreatmentTypes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground"
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>

              {results.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-border bg-secondary/50 p-6 text-center">
                  <h3 className="mb-1.5 text-[16px] font-semibold">No therapists were found for this search.</h3>
                  <p className="mb-5 text-[13.5px] text-muted-fg">
                    Try changing the session type, languages, or type of treatment.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    <Button variant="outline" onClick={changeSearch}>
                      Change search
                    </Button>
                    <Button onClick={browseAllProfessionals}>Browse all professionals</Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-[18px] sm:grid-cols-2">
                  {results.map((r) => (
                    <ResultCard
                      key={r.therapist.id}
                      result={r}
                      sessionType={sessionType as BrowseSessionType}
                      serviceType={serviceType}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
