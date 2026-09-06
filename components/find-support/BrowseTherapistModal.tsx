"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Globe2, MapPin, Search, ArrowLeft, BadgeCheck, Locate } from "lucide-react";
import Button from "@/components/ui/Button";
import BookSessionButton from "@/components/therapists/BookSessionButton";
import { COUNTRY_NAMES } from "@/lib/countries";
import {
  searchTherapists,
  validateBrowseSearch,
  isBrowseSearchValid,
  type BrowseSessionType,
  type BrowseSearchResult,
} from "@/lib/browseTherapistSearch";
import type { PublicTherapistRow } from "@/lib/database.types";

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
  country,
  cityOrAddress,
}: {
  result: BrowseSearchResult;
  sessionType: BrowseSessionType;
  country: string;
  cityOrAddress: string;
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
        <BookSessionButton
          therapist={t}
          ctaLabel="Book a session"
          bookingMetadata={{
            sessionType,
            country,
            cityOrAddress: sessionType === "in_person" ? cityOrAddress || null : cityOrAddress || null,
          }}
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
}: {
  open: boolean;
  onClose: () => void;
  therapists: PublicTherapistRow[];
}) {
  const [step, setStep] = useState<"search" | "results">("search");
  const [sessionType, setSessionType] = useState<BrowseSessionType | null>(null);
  const [country, setCountry] = useState("");
  const [cityOrAddress, setCityOrAddress] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BrowseSearchResult[] | null>(null);
  const [geoPending, setGeoPending] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errors = useMemo(
    () => (attempted ? validateBrowseSearch({ sessionType, country, cityOrAddress }) : {}),
    [attempted, sessionType, country, cityOrAddress]
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
      setCountry("");
      setCityOrAddress("");
      setAttempted(false);
      setResults(null);
      setGeoError(null);
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

  function runSearch() {
    setAttempted(true);
    const criteria = { sessionType, country, cityOrAddress };
    const validation = validateBrowseSearch(criteria);
    if (Object.keys(validation).length > 0 || !sessionType) return;
    setSearching(true);
    // Phase 151 — this "search" runs against therapists already fetched by
    // the page (the same list Our Professionals uses), not a live network
    // request, so there's nothing to actually await. A short, deliberate
    // delay keeps the "Finding therapists near you…" loading state the spec
    // asked for from flashing by unreadably fast, rather than faking a
    // network round-trip that doesn't exist.
    searchTimeoutRef.current = setTimeout(() => {
      setResults(searchTherapists(therapists, { sessionType, country, cityOrAddress }));
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
    if (country) params.set("country", country);
    if (cityOrAddress) params.set("city", cityOrAddress);
    onClose();
    window.location.href = `/therapists?${params.toString()}`;
  }

  // Optional per the spec ("if geolocation is already supported") — this
  // app has no geocoding/reverse-geocoding service anywhere (no mapping API
  // key wired into any existing route), so a raw lat/lng coordinate can't be
  // turned into a country/city name here. Rather than build a fake version
  // of this feature (e.g. silently leaving Country blank while pretending
  // location was captured), it degrades to a clear, honest error and manual
  // entry always remains available — exactly the spec's own fallback.
  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location isn't available in this browser — please enter your country manually.");
      return;
    }
    setGeoPending(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoPending(false);
        setGeoError(
          "We couldn't automatically match your location to a country — please select it from the list below."
        );
      },
      () => {
        setGeoPending(false);
        setGeoError("Location access was denied — please enter your country manually.");
      },
      { timeout: 8000 }
    );
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
      <div
        ref={dialogRef}
        className="relative w-full max-w-[880px] rounded-2xl bg-card p-6 shadow-2xl sm:p-8"
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
              <h2 className="mb-1.5 text-[22px]">Find a therapist</h2>
              <p className="mb-6 text-muted-fg">Choose how and where you would like to receive support.</p>

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
                          Find professionals available near your selected location.
                        </span>
                      </span>
                    </button>
                  </div>
                  {errors.sessionType && <p className="mt-1.5 text-[12.5px] text-destructive">{errors.sessionType}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Location</label>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label htmlFor="browse-country" className="mb-1 block text-[12.5px] font-medium text-muted-fg">
                        Country <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="browse-country"
                        list="browse-country-list"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Start typing your country…"
                        className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                      />
                      <datalist id="browse-country-list">
                        {COUNTRY_NAMES.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                      {errors.country && <p className="mt-1 text-[12.5px] text-destructive">{errors.country}</p>}
                    </div>

                    <div>
                      <label htmlFor="browse-city" className="mb-1 block text-[12.5px] font-medium text-muted-fg">
                        City / address {sessionType === "in_person" ? <span className="text-destructive">*</span> : "(optional)"}
                      </label>
                      <input
                        id="browse-city"
                        value={cityOrAddress}
                        onChange={(e) => setCityOrAddress(e.target.value)}
                        placeholder="e.g. Tel Aviv"
                        className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
                      />
                      {errors.cityOrAddress && (
                        <p className="mt-1 text-[12.5px] text-destructive">{errors.cityOrAddress}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={geoPending}
                      className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline disabled:opacity-60"
                    >
                      <Locate size={13} /> {geoPending ? "Locating…" : "Use my current location"}
                    </button>
                    {geoError && <p className="text-[12.5px] text-muted-fg">{geoError}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <Button
                  onClick={runSearch}
                  disabled={searching || !isBrowseSearchValid({ sessionType, country, cityOrAddress })}
                  block
                >
                  <Search size={16} /> {searching ? "Finding therapists near you…" : "Start browsing therapists"}
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
                {sessionType === "in_person" && cityOrAddress
                  ? `Therapists near ${cityOrAddress}, ${country}`
                  : `Therapists available in ${country}`}
              </h2>
              <p className="mb-3 text-[13.5px] text-muted-fg" aria-live="polite">
                {resultCountLabel}
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground">
                  {sessionType === "online" ? "Online" : "In-person"}
                </span>
                <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-[12.5px] font-medium text-foreground">
                  {[cityOrAddress, country].filter(Boolean).join(", ")}
                </span>
              </div>

              {results.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-border bg-secondary/50 p-6 text-center">
                  <h3 className="mb-1.5 text-[16px] font-semibold">No therapists were found for this search.</h3>
                  <p className="mb-5 text-[13.5px] text-muted-fg">
                    Try changing the session type, country, city, or address.
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
                      country={country}
                      cityOrAddress={cityOrAddress}
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
