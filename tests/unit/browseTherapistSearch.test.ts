import { searchTherapists, validateBrowseSearch, isBrowseSearchValid } from "@/lib/browseTherapistSearch";
import type { PublicTherapistRow } from "@/lib/database.types";

// Phase 151 — covers the Browse Therapist search's pure filtering/validation
// logic (see lib/browseTherapistSearch.ts).
//
// Phase 221 — rewritten for the Location (Country)/City-address -> Languages/
// Type of Treatment field swap. Required-field validation, case-insensitive
// language-overlap matching, optional treatment-type overlap matching (with
// "No preference" as a no-op filter), and result count/no-results behavior
// each get their own describe block below, mirroring the original file's
// structure.

function makeTherapist(overrides: Partial<PublicTherapistRow>): PublicTherapistRow {
  return {
    id: overrides.id ?? "1",
    full_name: overrides.full_name ?? "Jane Doe",
    slug: overrides.slug ?? "jane-doe",
    bio: overrides.bio ?? null,
    credentials: overrides.credentials ?? null,
    gender: overrides.gender ?? null,
    is_verified: overrides.is_verified ?? false,
    languages: overrides.languages ?? [],
    photo_url: overrides.photo_url ?? null,
    session_lengths: overrides.session_lengths ?? [],
    short_summary: overrides.short_summary ?? null,
    specialties: overrides.specialties ?? [],
    time_zone: overrides.time_zone ?? null,
    tracks: overrides.tracks ?? [],
    years_experience: overrides.years_experience ?? null,
    diary_link: overrides.diary_link ?? null,
    diary_link_status: overrides.diary_link_status ?? "unset",
    country: overrides.country ?? null,
    price_note: overrides.price_note ?? null,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00.000Z",
    has_whatsapp: overrides.has_whatsapp ?? false,
    offers_online: overrides.offers_online ?? true,
    offers_in_person: overrides.offers_in_person ?? false,
    city: overrides.city ?? null,
    support_pathways: overrides.support_pathways ?? [],
    session_price_amount: overrides.session_price_amount ?? null,
    session_price_currency: overrides.session_price_currency ?? "USD",
  };
}

describe("validateBrowseSearch — required field validation", () => {
  it("requires a session type", () => {
    const errors = validateBrowseSearch({ sessionType: null, languages: ["English"], treatmentTypes: [] });
    expect(errors.sessionType).toBe("Please select a session type.");
  });

  it("requires at least one language", () => {
    const errors = validateBrowseSearch({ sessionType: "online", languages: [], treatmentTypes: [] });
    expect(errors.languages).toBe("Please select at least one language.");
  });

  it("does not require any treatment type — No preference is valid", () => {
    const errors = validateBrowseSearch({ sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(errors.languages).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("is valid once session type and at least one language are set", () => {
    expect(isBrowseSearchValid({ sessionType: "online", languages: [], treatmentTypes: [] })).toBe(false);
    expect(isBrowseSearchValid({ sessionType: null, languages: ["English"], treatmentTypes: [] })).toBe(false);
    expect(isBrowseSearchValid({ sessionType: "online", languages: ["English"], treatmentTypes: [] })).toBe(true);
    expect(isBrowseSearchValid({ sessionType: "in_person", languages: ["English"], treatmentTypes: ["CBT"] })).toBe(
      true
    );
  });
});

describe("searchTherapists — session format", () => {
  const therapists = [
    makeTherapist({ id: "1", full_name: "Online only", offers_online: true, offers_in_person: false, languages: ["English"] }),
    makeTherapist({ id: "2", full_name: "In-person only", offers_online: false, offers_in_person: true, languages: ["English"] }),
    makeTherapist({ id: "3", full_name: "Both", offers_online: true, offers_in_person: true, languages: ["English"] }),
  ];

  it("includes only therapists offering online sessions for an online search", () => {
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id).sort()).toEqual(["1", "3"]);
  });

  it("includes only therapists offering in-person sessions for an in-person search", () => {
    const results = searchTherapists(therapists, { sessionType: "in_person", languages: ["English"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id).sort()).toEqual(["2", "3"]);
  });

  it("no longer filters by country or city — geography was removed from this search", () => {
    const remote = makeTherapist({ id: "4", full_name: "Remote", offers_online: true, country: "France", languages: ["English"] });
    const results = searchTherapists([remote], { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id)).toContain("4");
  });
});

describe("searchTherapists — language matching (required)", () => {
  const therapists = [
    makeTherapist({ id: "1", full_name: "English speaker", languages: ["English"] }),
    makeTherapist({ id: "2", full_name: "Arabic speaker", languages: ["Arabic"] }),
    makeTherapist({ id: "3", full_name: "Bilingual", languages: ["English", "Spanish"] }),
    makeTherapist({ id: "4", full_name: "No languages on file", languages: [] }),
  ];

  it("includes a therapist who supports at least one selected language", () => {
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id).sort()).toEqual(["1", "3"]);
  });

  it("matches when the therapist supports any of several selected languages", () => {
    const results = searchTherapists(therapists, {
      sessionType: "online",
      languages: ["Arabic", "Spanish"],
      treatmentTypes: [],
    });
    expect(results.map((r) => r.therapist.id).sort()).toEqual(["2", "3"]);
  });

  it("excludes a therapist who supports none of the selected languages", () => {
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["French"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id)).toHaveLength(0);
  });

  it("excludes a therapist with no languages on file — Languages is a required field with nothing to overlap", () => {
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id)).not.toContain("4");
  });

  it("matches languages case-insensitively", () => {
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["english"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id)).toContain("1");
  });

  it("matches an 'Other: <text>' stored value against the same plain text search", () => {
    const other = makeTherapist({ id: "5", full_name: "Custom language", languages: ["Other: Yiddish"] });
    const results = searchTherapists([other], { sessionType: "online", languages: ["Yiddish"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id)).toContain("5");
  });
});

describe("searchTherapists — treatment type matching (optional, 'No preference' default)", () => {
  const therapists = [
    makeTherapist({ id: "1", full_name: "CBT", languages: ["English"], specialties: ["CBT"] }),
    makeTherapist({ id: "2", full_name: "Trauma Support", languages: ["English"], specialties: ["Trauma Support"] }),
    makeTherapist({ id: "3", full_name: "Both", languages: ["English"], specialties: ["CBT", "Trauma Support"] }),
    makeTherapist({ id: "4", full_name: "No specialties on file", languages: ["English"], specialties: [] }),
  ];

  it("applies no treatment filter when no treatment types are selected ('No preference')", () => {
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results.map((r) => r.therapist.id).sort()).toEqual(["1", "2", "3", "4"]);
  });

  it("includes a therapist whose specialties overlap at least one selected treatment type", () => {
    const results = searchTherapists(therapists, {
      sessionType: "online",
      languages: ["English"],
      treatmentTypes: ["CBT"],
    });
    expect(results.map((r) => r.therapist.id).sort()).toEqual(["1", "3"]);
  });

  it("excludes a therapist whose specialties don't overlap any selected treatment type", () => {
    const results = searchTherapists(therapists, {
      sessionType: "online",
      languages: ["English"],
      treatmentTypes: ["CBT"],
    });
    expect(results.map((r) => r.therapist.id)).not.toContain("2");
  });

  it("excludes a therapist with no specialties on file once a treatment type is selected", () => {
    const results = searchTherapists(therapists, {
      sessionType: "online",
      languages: ["English"],
      treatmentTypes: ["CBT"],
    });
    expect(results.map((r) => r.therapist.id)).not.toContain("4");
  });

  it("applies both the language and treatment-type filters together", () => {
    const withDifferentLanguage = makeTherapist({
      id: "5",
      full_name: "CBT but French only",
      languages: ["French"],
      specialties: ["CBT"],
    });
    const results = searchTherapists([...therapists, withDifferentLanguage], {
      sessionType: "online",
      languages: ["English"],
      treatmentTypes: ["CBT"],
    });
    expect(results.map((r) => r.therapist.id).sort()).toEqual(["1", "3"]);
  });
});

describe("searchTherapists — result count / no-results", () => {
  it("returns an empty array when nothing matches", () => {
    const therapists = [makeTherapist({ id: "1", offers_online: true, languages: ["French"] })];
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results).toHaveLength(0);
  });

  it("returns every matching therapist, for an accurate result count", () => {
    const therapists = [
      makeTherapist({ id: "1", offers_online: true, languages: ["English"] }),
      makeTherapist({ id: "2", offers_online: true, languages: ["English"] }),
      makeTherapist({ id: "3", offers_online: true, languages: ["French"] }),
    ];
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results).toHaveLength(2);
  });

  it("never claims a precise distance — distanceKm is always null without real coordinates", () => {
    const therapists = [makeTherapist({ id: "1", offers_online: true, languages: ["English"] })];
    const results = searchTherapists(therapists, { sessionType: "online", languages: ["English"], treatmentTypes: [] });
    expect(results.every((r) => r.distanceKm === null)).toBe(true);
  });
});
