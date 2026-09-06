import type { PublicTherapistRow } from "@/lib/database.types";

// Phase 151 — pure filtering/validation logic for the Find Support page's
// "Browse therapist" search (components/find-support/BrowseTherapistModal).
// Kept as a standalone module (not inline in the modal component) so it's
// unit-testable without rendering React, and so the exact same logic can't
// drift between the modal and any future consumer.

export type BrowseSessionType = "online" | "in_person";

export type BrowseSearchCriteria = {
  sessionType: BrowseSessionType | null;
  country: string;
  cityOrAddress: string;
};

export type BrowseSearchErrors = {
  sessionType?: string;
  country?: string;
  cityOrAddress?: string;
};

// Exact copy from the spec — kept here, not re-typed at each call site, so
// the validation messages and the fields they gate can never drift apart.
export function validateBrowseSearch(criteria: BrowseSearchCriteria): BrowseSearchErrors {
  const errors: BrowseSearchErrors = {};
  if (!criteria.sessionType) {
    errors.sessionType = "Please select a session type.";
  }
  if (!criteria.country.trim()) {
    errors.country = "Please select your country.";
  }
  if (criteria.sessionType === "in_person" && !criteria.cityOrAddress.trim()) {
    errors.cityOrAddress = "Please enter a city or address for in-person sessions.";
  }
  return errors;
}

export function isBrowseSearchValid(criteria: BrowseSearchCriteria): boolean {
  return Object.keys(validateBrowseSearch(criteria)).length === 0;
}

export type BrowseSearchResult = {
  therapist: PublicTherapistRow;
  // Only ever non-null when both the therapist record and the search
  // itself carry real coordinates. No geocoding step exists anywhere in
  // this app today (see the therapists.latitude/longitude column comments),
  // so in practice this is always null — the UI must never present a
  // distance number when it is, per the spec's own "clearly avoid claiming
  // precise proximity" instruction.
  distanceKm: number | null;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Haversine distance — wired up and ready for the day therapist coordinates
// exist, even though nothing calls it with two real coordinates yet.
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// The actual match rules (see EXECUTION_PLAN.md Phase 151 for the full
// writeup of why these specific rules, given what the schema does and
// doesn't track):
// - Online: therapist must have offers_online = true. Country matches if
//   the therapist's own country matches the search, OR the therapist has no
//   country on file at all (treated as globally available online, since
//   nothing else marks a therapist as country-restricted for remote work).
// - In-person: therapist must have offers_in_person = true AND a country
//   match (in-person can never be "global" — meeting in person requires
//   being in the same country). City/address is a soft filter: only
//   excludes a therapist when BOTH the search and the therapist record have
//   a city and neither contains the other as a substring; a therapist with
//   no city on file is never excluded on that basis alone, since we'd
//   rather show a possible match than hide one over missing data.
// - Distance ranking is a no-op today (see BrowseSearchResult.distanceKm)
//   since no therapist record has real coordinates yet.
export function searchTherapists(
  therapists: PublicTherapistRow[],
  criteria: { sessionType: BrowseSessionType; country: string; cityOrAddress: string }
): BrowseSearchResult[] {
  const country = normalize(criteria.country);
  const city = normalize(criteria.cityOrAddress);

  const filtered = therapists.filter((t) => {
    if (criteria.sessionType === "online") {
      if (!t.offers_online) return false;
      if (t.country && normalize(t.country) !== country) return false;
      return true;
    }
    // in_person
    if (!t.offers_in_person) return false;
    if (!t.country || normalize(t.country) !== country) return false;
    if (city && t.city) {
      const tCity = normalize(t.city);
      if (!tCity.includes(city) && !city.includes(tCity)) return false;
    }
    return true;
  });

  return filtered
    .slice()
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((t) => ({ therapist: t, distanceKm: null }));
}
