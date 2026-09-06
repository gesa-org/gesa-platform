// Phase 151 — shared country name list for Browse Therapist search's
// Country field. Built the same way components/ui/PhoneNumberInput.tsx
// already builds its own country list: `libphonenumber-js`'s getCountries()
// (already a project dependency, no new package added) for the real list of
// ISO country codes, `Intl.DisplayNames` (built into every modern browser)
// for human-readable names — no second hand-written "code -> name" list to
// maintain, and no external geocoding/autocomplete service involved.
import { getCountries } from "libphonenumber-js";

const REGION_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

// Computed once at module load — this list is identical for every visitor,
// same reasoning as PhoneNumberInput's COUNTRY_OPTIONS.
export const COUNTRY_NAMES: string[] = getCountries()
  .map((code) => REGION_NAMES?.of(code) ?? code)
  .sort((a, b) => a.localeCompare(b));
