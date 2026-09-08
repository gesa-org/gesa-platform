// Phase 151 — shared country name list for Browse Therapist search's
// Country field. Built the same way components/ui/PhoneNumberInput.tsx
// already builds its own country list: `libphonenumber-js`'s getCountries()
// (already a project dependency, no new package added) for the real list of
// ISO country codes, `Intl.DisplayNames` (built into every modern browser)
// for human-readable names — no second hand-written "code -> name" list to
// maintain, and no external geocoding/autocomplete service involved.
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

const REGION_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

// Computed once at module load — this list is identical for every visitor,
// same reasoning as PhoneNumberInput's COUNTRY_OPTIONS.
export const COUNTRY_NAMES: string[] = getCountries()
  .map((code) => REGION_NAMES?.of(code) ?? code)
  .sort((a, b) => a.localeCompare(b));

// Phase 169 — CrisisButton's new country selector needs flag + dial code
// alongside the name (same three fields PhoneNumberInput.tsx already
// computes for itself), so this is exported here once rather than
// duplicated a third time. Identical flag-emoji technique as
// PhoneNumberInput: a regional-indicator Unicode trick from the ISO code,
// no image assets shipped; falls back to the plain two-letter code on the
// rare platform that can't render flag-emoji glyphs.
export type CountryOption = { code: string; name: string; dial: string; flag: string };

function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: REGION_NAMES?.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
    flag: flagEmoji(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
