import { getTherapistCoverageLocations } from "@/lib/therapistCoverageLocations";

describe("therapist coverage locations", () => {
  it("normalizes country-name variations and retains the deliberate geographic sequence", () => {
    const locations = getTherapistCoverageLocations(["Australia", "UK", "USA", "Israel", "Portugal"]);

    expect(locations.map((location) => location.country)).toEqual([
      "United States",
      "Portugal",
      "United Kingdom",
      "Israel",
      "Australia",
    ]);
  });

  it("uses the complete mapped fallback only while no country value can be resolved", () => {
    const locations = getTherapistCoverageLocations([null, "Unmapped country"]);

    expect(locations.length).toBeGreaterThanOrEqual(12);
    expect(locations[0].country).toBe("United States");
    expect(locations[locations.length - 1]?.country).toBe("New Zealand");
  });
});
