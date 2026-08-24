// The real @anthropic-ai/sdk import chain needs a global `fetch` that jsdom
// (this project's Jest testEnvironment) doesn't provide at module-load time.
// Every scenario below exercises the no-API-key rule-based fallback path
// anyway, so the SDK is never actually called — mock it out rather than
// polyfilling fetch just to satisfy an import we don't use.
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: class {},
}));

import { matchTherapists } from "@/lib/ai/matchTherapists";
import type { Tables } from "@/lib/database.types";

// Phase 59 — Roy reported that choosing "Male" in the Find Your Therapist
// wizard still surfaced female therapists. Root cause: matchTherapists()
// treated genderPreference as a soft +2 score bonus (rule-based path) and
// explicitly told the AI to treat it as "a soft preference, not a hard
// filter." This test exercises the no-API-key rule-based fallback path
// (deterministic, no network) and asserts gender is now a hard filter on
// the candidate pool, with a safe fallback (flagged via
// genderPreferenceHonored) only when nobody of the requested gender exists.
type Candidate = Pick<
  Tables<"therapists">,
  "id" | "full_name" | "specialties" | "short_summary" | "bio" | "languages" | "gender" | "years_experience"
>;

function makeCandidate(overrides: Partial<Candidate>): Candidate {
  return {
    id: overrides.id ?? "1",
    full_name: overrides.full_name ?? "Jane Doe",
    specialties: overrides.specialties ?? [],
    short_summary: overrides.short_summary ?? null,
    bio: overrides.bio ?? null,
    languages: overrides.languages ?? ["English"],
    gender: overrides.gender ?? "no_preference",
    years_experience: overrides.years_experience ?? null,
  };
}

describe("matchTherapists (rule-based fallback — no ANTHROPIC_API_KEY set)", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterAll(() => {
    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("only returns therapists of the requested gender when the roster has some", async () => {
    const candidates = [
      makeCandidate({ id: "male-1", gender: "man", specialties: ["CBT"] }),
      makeCandidate({ id: "female-1", gender: "woman", specialties: ["CBT"] }),
      makeCandidate({ id: "female-2", gender: "woman", specialties: ["CBT"] }),
    ];

    const { matches, genderPreferenceHonored } = await matchTherapists(
      { symptoms: [], treatmentType: "CBT", genderPreference: "man" },
      candidates
    );

    expect(genderPreferenceHonored).toBe(true);
    expect(matches.length).toBeGreaterThan(0);
    matches.forEach((m) => {
      const t = candidates.find((c) => c.id === m.therapistId);
      expect(t?.gender).toBe("man");
    });
  });

  it("falls back to the full pool (flagged) when nobody of the requested gender is available", async () => {
    // Mirrors the real current roster: every active therapist is
    // gender = "no_preference" (unset), so a hard filter for "man" or
    // "woman" would otherwise return zero matches.
    const candidates = [
      makeCandidate({ id: "t1", gender: "no_preference", specialties: ["Trauma Support"] }),
      makeCandidate({ id: "t2", gender: "no_preference", specialties: ["Trauma Support"] }),
    ];

    const { matches, genderPreferenceHonored } = await matchTherapists(
      { symptoms: [], treatmentType: "Trauma Support", genderPreference: "woman" },
      candidates
    );

    expect(genderPreferenceHonored).toBe(false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("does not filter by gender at all when the client has no preference", async () => {
    const candidates = [
      makeCandidate({ id: "t1", gender: "man", specialties: ["CBT"] }),
      makeCandidate({ id: "t2", gender: "woman", specialties: ["CBT"] }),
    ];

    const { matches, genderPreferenceHonored } = await matchTherapists(
      { symptoms: [], treatmentType: "CBT", genderPreference: "no_preference" },
      candidates
    );

    expect(genderPreferenceHonored).toBe(true);
    expect(matches.length).toBe(2);
  });

  it("ranks an exact treatment-type/specialty match above unrelated therapists", async () => {
    const candidates = [
      makeCandidate({ id: "wrong-fit", specialties: ["Life Coaching"], short_summary: "General coaching support." }),
      makeCandidate({ id: "right-fit", specialties: ["CBT"], short_summary: "CBT specialist." }),
    ];

    const { matches } = await matchTherapists(
      { symptoms: ["anxiety"], treatmentType: "CBT", genderPreference: "no_preference" },
      candidates
    );

    expect(matches[0].therapistId).toBe("right-fit");
  });
});
