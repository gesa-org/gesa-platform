export type GlobalVolunteerCoverageMarker = {
  id: string;
  label: string;
  x: number;
  y: number;
  tooltipAlign?: "start" | "center" | "end";
};

// Representative regions only — replace this mock presentation data with
// verified coverage data before presenting numerical or country-level claims.
export const GLOBAL_VOLUNTEER_COVERAGE_MARKERS: GlobalVolunteerCoverageMarker[] = [
  { id: "north-america", label: "North America volunteer community", x: 23, y: 35, tooltipAlign: "start" },
  { id: "latin-america", label: "Latin America volunteer community", x: 30, y: 64, tooltipAlign: "start" },
  { id: "europe", label: "Europe volunteer community", x: 48, y: 31 },
  { id: "africa", label: "Africa volunteer community", x: 49, y: 57 },
  { id: "middle-east", label: "Middle East volunteer community", x: 57, y: 43 },
  { id: "south-asia", label: "South Asia volunteer community", x: 66, y: 51 },
  { id: "east-asia", label: "East Asia volunteer community", x: 75, y: 38, tooltipAlign: "end" },
  { id: "southeast-asia", label: "Southeast Asia volunteer community", x: 74, y: 60, tooltipAlign: "end" },
  { id: "oceania", label: "Oceania volunteer community", x: 84, y: 72, tooltipAlign: "end" },
];

export type GlobalVolunteerCoverageMetric = {
  label: string;
  value: string;
};

// Intentionally non-numeric until GESA supplies verified network metrics.
export const GLOBAL_VOLUNTEER_COVERAGE_METRICS: GlobalVolunteerCoverageMetric[] = [
  { label: "Countries represented", value: "—" },
  { label: "Volunteer community", value: "—" },
  { label: "Available across time zones", value: "—" },
];
