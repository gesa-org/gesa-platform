export type TherapistCoverageLocation = {
  id: string;
  country: string;
  left: string;
  top: string;
};

// These positions are deliberately relative to the Earth Horizon film frame,
// rather than a page coordinate system, so the beacons remain on its land band.
const COUNTRY_TO_HORIZON_LOCATION: Record<string, TherapistCoverageLocation> = {
  "united states": { id: "united-states", country: "United States", left: "27%", top: "69%" },
  mexico: { id: "mexico", country: "Mexico", left: "31%", top: "74%" },
  argentina: { id: "argentina", country: "Argentina", left: "37%", top: "80%" },
  brazil: { id: "brazil", country: "Brazil", left: "41%", top: "77%" },
  portugal: { id: "portugal", country: "Portugal", left: "49%", top: "71%" },
  spain: { id: "spain", country: "Spain", left: "51%", top: "74%" },
  "united kingdom": { id: "united-kingdom", country: "United Kingdom", left: "52%", top: "68%" },
  germany: { id: "germany", country: "Germany", left: "55%", top: "71%" },
  bulgaria: { id: "bulgaria", country: "Bulgaria", left: "58%", top: "74%" },
  israel: { id: "israel", country: "Israel", left: "60%", top: "77%" },
  australia: { id: "australia", country: "Australia", left: "78%", top: "76%" },
  "new zealand": { id: "new-zealand", country: "New Zealand", left: "84%", top: "80%" },
};

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "united states",
  "u s a": "united states",
  "u s": "united states",
  america: "united states",
  uk: "united kingdom",
  "u k": "united kingdom",
  britain: "united kingdom",
  england: "united kingdom",
};

// This geographic order gives the one-at-a-time beacon a calm, continuous
// path across the Americas, Europe/Middle East, then Oceania.
const COVERAGE_SEQUENCE = [
  "united states",
  "mexico",
  "argentina",
  "brazil",
  "portugal",
  "spain",
  "united kingdom",
  "germany",
  "bulgaria",
  "israel",
  "australia",
  "new zealand",
] as const;

function normalizeCountry(country: string) {
  const normalized = country.trim().toLowerCase().replace(/[^a-z]+/g, " ").trim();
  return COUNTRY_ALIASES[normalized] ?? normalized;
}

/**
 * Resolves the public directory's country values into the visual's safe,
 * deterministic location sequence. The fallback keeps the hero complete
 * during an empty/error state before the public therapist list is available.
 */
export function getTherapistCoverageLocations(
  countries: readonly (string | null | undefined)[],
): TherapistCoverageLocation[] {
  const representedCountries = new Set(
    countries.filter((country): country is string => Boolean(country?.trim())).map(normalizeCountry),
  );
  const matchedLocations = COVERAGE_SEQUENCE.filter((country) => representedCountries.has(country)).map(
    (country) => COUNTRY_TO_HORIZON_LOCATION[country],
  );

  return matchedLocations.length > 0
    ? matchedLocations
    : COVERAGE_SEQUENCE.map((country) => COUNTRY_TO_HORIZON_LOCATION[country]);
}
