import { searchTherapists, validateBrowseSearch, isBrowseSearchValid } from "@/lib/browseTherapistSearch";
import type { PublicTherapistRow } from "@/lib/database.types";

// Phase 151 — covers the Browse Therapist search's pure filtering/validation
// logic (see lib/browseTherapistSearch.ts). The spec's own "Add or update
// tests for" list asked specifically for: required field validation, online
// country-based matching, in-person country/city matching, and result
// count/no-results behavior — each gets its own describe block below.

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
  };
}

describe("validateBrowseSearch — required field validation", () => {
  it("requires a session type", () => {
    const errors = validateBrowseSearch({ sessionType: null, country: "Israel", cityOrAddress: "" });
    expect(errors.sessionType).toBe("Please select a session type.");
  });

  it("requires a country", () => {
    const errors = validateBrowseSearch({ sessionType: "online", country: "", cityOrAddress: "" });
    expect(errors.country).toBe("Please select your country.");
  });

  it("requires a city/address only for in-person, not online", () => {
    const online = validateBrowseSearch({ sessionType: "online", country: "Israel", cityOrAddress: "" });
    expect(online.cityOrAddress).toBeUndefined();

    const inPerson = validateBrowseSearch({ sessionType: "in_person", country: "Israel", cityOrAddress: "" });
    expect(inPerson.cityOrAddress).toBe("Please enter a city or address for in-person sessions.");
  });

  it("is valid once every required field for the chosen session type is filled in", () => {
    expect(isBrowseSearchValid({ sessionType: "online", country: "Israel", cityOrAddress: "" })).toBe(true);
    expect(isBrowseSearchValid({ sessionType: "in_person", country: "Israel", cityOrAddress: "" })).toBe(false);
    expect(isBrowseSearchValid({ sessionType: "in_person", country: "Israel", cityOrAddress: "Tel Aviv" })).toBe(true);
  });
});

describe("searchTherapists — online, country-based matching", () => {
  const therapists = [
    makeTherapist({ id: "1", full_name: "Online, Israel", offers_online: true, country: "Israel" }),
    makeTherapist({ id: "2", full_name: "Online, no country on file", offers_online: true, country: null }),
    makeTherapist({ id: "3", full_name: "Online, different country", offers_online: true, country: "France" }),
    makeTherapist({ id: "4", full_name: "In-person only", offers_online: false, offers_in_person: true, country: "Israel" }),
  ];

  it("includes a therapist whose country matches the search", () => {
    const results = searchTherapists(therapists, { sessionType: "online", country: "Israel", cityOrAddress: "" });
    expect(results.map((r) => r.therapist.id)).toContain("1");
  });

  it("includes a therapist with no country on file, treating them as globally available online", () => {
    const results = searchTherapists(therapists, { sessionType: "online", country: "Israel", cityOrAddress: "" });
    expect(results.map((r) => r.therapist.id)).toContain("2");
  });

  it("excludes a therapist whose country doesn't match", () => {
    const results = searchTherapists(therapists, { sessionType: "online", country: "Israel", cityOrAddress: "" });
    expect(results.map((r) => r.therapist.id)).not.toContain("3");
  });

  it("excludes a therapist who doesn't offer online sessions at all", () => {
    const results = searchTherapists(therapists, { sessionType: "online", country: "Israel", cityOrAddress: "" });
    expect(results.map((r) => r.therapist.id)).not.toContain("4");
  });

  it("matches country case-insensitively", () => {
    const results = searchTherapists(therapists, { sessionType: "online", country: "israel", cityOrAddress: "" });
    expect(results.map((r) => r.therapist.id)).toContain("1");
  });
});

describe("searchTherapists — in-person country/city matching", () => {
  const therapists = [
    makeTherapist({ id: "1", full_name: "Tel Aviv", offers_in_person: true, country: "Israel", city: "Tel Aviv" }),
    makeTherapist({ id: "2", full_name: "Haifa", offers_in_person: true, country: "Israel", city: "Haifa" }),
    makeTherapist({ id: "3", full_name: "No city on file", offers_in_person: true, country: "Israel", city: null }),
    makeTherapist({ id: "4", full_name: "Wrong country", offers_in_person: true, country: "France", city: "Paris" }),
    makeTherapist({ id: "5", full_name: "Online only", offers_in_person: false, offers_online: true, country: "Israel", city: "Tel Aviv" }),
  ];

  it("requires a country match — in-person is never global", () => {
    const results = searchTherapists(therapists, { sessionType: "in_person", country: "Israel", cityOrAddress: "Tel Aviv" });
    expect(results.map((r) => r.therapist.id)).not.toContain("4");
  });

  it("excludes a therapist who doesn't offer in-person sessions", () => {
    const results = searchTherapists(therapists, { sessionType: "in_person", country: "Israel", cityOrAddress: "Tel Aviv" });
    expect(results.map((r) => r.therapist.id)).not.toContain("5");
  });

  it("matches on city when both the search and the record have one", () => {
    const results = searchTherapists(therapists, { sessionType: "in_person", country: "Israel", cityOrAddress: "Tel Aviv" });
    expect(results.map((r) => r.therapist.id)).toContain("1");
    expect(results.map((r) => r.therapist.id)).not.toContain("2");
  });

  it("does not exclude a therapist with no city on file, since we'd rather show a possible match than hide one over missing data", () => {
    const results = searchTherapists(therapists, { sessionType: "in_person", country: "Israel", cityOrAddress: "Tel Aviv" });
    expect(results.map((r) => r.therapist.id)).toContain("3");
  });

  it("never claims a precise distance — distanceKm is always null without real coordinates", () => {
    const results = searchTherapists(therapists, { sessionType: "in_person", country: "Israel", cityOrAddress: "Tel Aviv" });
    expect(results.every((r) => r.distanceKm === null)).toBe(true);
  });
});

describe("searchTherapists — result count / no-results", () => {
  it("returns an empty array when nothing matches", () => {
    const therapists = [makeTherapist({ id: "1", offers_online: true, country: "France" })];
    const results = searchTherapists(therapists, { sessionType: "online", country: "Israel", cityOrAddress: "" });
    expect(results).toHaveLength(0);
  });

  it("returns every matching therapist, for an accurate result count", () => {
    const therapists = [
      makeTherapist({ id: "1", offers_online: true, country: "Israel" }),
      makeTherapist({ id: "2", offers_online: true, country: "Israel" }),
      makeTherapist({ id: "3", offers_online: true, country: "France" }),
    ];
    const results = searchTherapists(therapists, { sessionType: "online", country: "Israel", cityOrAddress: "" });
    expect(results).toHaveLength(2);
  });
});
