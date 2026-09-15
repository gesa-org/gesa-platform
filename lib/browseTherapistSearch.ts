import type { PublicTherapistRow } from "@/lib/database.types";

// Phase 151 — pure filtering/validation logic for the Find Support page's
// "Browse therapist" search (components/find-support/BrowseTherapistModal).
// Kept as a standalone module (not inline in the modal component) so it's
// unit-testable without rendering React, and so the exact same logic can't
// drift between the modal and any future consumer.
//
// Phase 221 — Roy asked for the Location (Country) and City/address fields
// on this search (used by both the Charity Services and Professional
// Services "Find a professional" entry points, via CommunityServiceModal)
// to be replaced with therapist-matching fields: a required "Languages"
// multi-select and an optional "Type of Treatment" multi-select, matching
// against the therapist record's own `languages`/`specialties` columns
// instead of `country`/`city`. Country/city/geolocation are removed from
// this search entirely (not just hidden) — see BrowseTherapistModal.tsx's
// own comment for what stayed unchanged (Type of session: Online/
// In-person).

export type BrowseSessionType = "online" | "in_person";

export type BrowseSearchCriteria = {
  sessionType: BrowseSessionType | null;
  /** Required — at least one language must be selected. */
  languages: string[];
  /** Optional — an empty array means "No preference" (no treatment-type filter applied). */
  treatmentTypes: string[];
};

export type BrowseSearchErrors = {
  sessionType?: string;
  languages?: string;
};

export function validateBrowseSearch(criteria: BrowseSearchCriteria): BrowseSearchErrors {
  const errors: BrowseSearchErrors = {};
  if (!criteria.sessionType) {
    errors.sessionType = "Please select a session type.";
  }
  if (criteria.languages.length === 0) {
    errors.languages = "Please select at least one language.";
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
  // so in practice this is always null. Kept on this type (rather than
  // removed) since haversineDistanceKm below is still wired up and ready
  // for the day therapist coordinates exist, independent of this phase's
  // Location field removal.
  distanceKm: number | null;
};

// Strips a leading "Other: " prefix (case-insensitively) before lowercasing
// — therapist records that picked "Other"/"Other language" during onboarding
// are stored as "Other: <their text>" (see VolunteerApplicationModal.tsx's
// submit handler), while this search's own "Other" entries are resolved to
// the bare typed text before reaching this function (see
// BrowseTherapistModal.tsx's effectiveSelections helper) — normalizing both
// sides the same way lets a therapist who entered "Other: Yiddish" still
// match a search for "Yiddish".
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/^other:\s*/, "");
}

/** Case-insensitive "do these two string arrays share at least one value?" check. */
function hasOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const normalizedB = new Set(b.map(normalize));
  return a.some((v) => normalizedB.has(normalize(v)));
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

// The actual match rules (Phase 221 — see EXECUTION_PLAN.md for the full
// writeup):
// - Session format: therapist must have offers_online = true (for
//   sessionType "online") or offers_in_person = true (for "in_person"). No
//   longer paired with any country/city requirement — Roy asked for
//   Location to be removed from this search outright, not narrowed.
// - Languages (required): a therapist matches if at least one of their own
//   `languages` values case-insensitively equals at least one of the
//   search's selected languages. A therapist with no languages on file
//   never matches, since Languages is a required search field — there's
//   nothing to overlap with.
// - Type of Treatment (optional, "No preference" default): when the search
//   has no treatment types selected, this filter is skipped entirely (every
//   session-format/language match passes). When one or more are selected, a
//   therapist matches if at least one of their own `specialties` values
//   case-insensitively equals at least one of the search's selected
//   treatment types.
// - Distance ranking is a no-op today (see BrowseSearchResult.distanceKm)
//   since no therapist record has real coordinates yet.
export function searchTherapists(
  therapists: PublicTherapistRow[],
  criteria: { sessionType: BrowseSessionType; languages: string[]; treatmentTypes: string[] }
): BrowseSearchResult[] {
  const filtered = therapists.filter((t) => {
    if (criteria.sessionType === "online" && !t.offers_online) return false;
    if (criteria.sessionType === "in_person" && !t.offers_in_person) return false;
    if (!hasOverlap(t.languages ?? [], criteria.languages)) return false;
    if (criteria.treatmentTypes.length > 0 && !hasOverlap(t.specialties ?? [], criteria.treatmentTypes)) return false;
    return true;
  });

  return filtered
    .slice()
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((t) => ({ therapist: t, distanceKm: null }));
}
