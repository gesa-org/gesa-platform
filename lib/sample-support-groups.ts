// Placeholder support-group data for Phase 2 (UI only).
// Phase 3 replaces this with a live Supabase query against `support_groups`.
export interface SupportGroup {
  id: string;
  title: string;
  description: string;
  facilitatorName: string;
  format: "online" | "in_person";
  location: string;
  schedule: string;
  capacity: number;
}

export const SAMPLE_GROUPS: SupportGroup[] = [
  {
    id: "diaspora-voices",
    title: "Diaspora Voices",
    description: "A safe space to process discrimination, antisemitism, and identity in the diaspora.",
    facilitatorName: "Ari Goldberg",
    format: "online",
    location: "Zoom",
    schedule: "Thursdays, 19:00 EST",
    capacity: 10,
  },
  {
    id: "grief-companions",
    title: "Grief Companions",
    description: "In-person circle for shared grief and remembrance.",
    facilitatorName: "Dr. Priya Nair",
    format: "in_person",
    location: "GESA Community Room, Berlin",
    schedule: "1st & 3rd Sunday, 15:00 CET",
    capacity: 8,
  },
  {
    id: "healing-after-conflict",
    title: "Healing After Conflict",
    description:
      "A trauma-informed circle for those affected by war and sudden loss. A gentle, held space to share and steady.",
    facilitatorName: "Dr. Naomi Feldman",
    format: "online",
    location: "Zoom (link on registration)",
    schedule: "Tuesdays, 18:00 CET",
    capacity: 12,
  },
  {
    id: "helping-the-helpers",
    title: "Helping the Helpers",
    description: "For therapists and frontline caregivers navigating burnout and vicarious trauma.",
    facilitatorName: "Dr. Layla Haddad",
    format: "online",
    location: "Zoom",
    schedule: "Mondays, 17:00 GMT",
    capacity: 15,
  },
  {
    id: "new-beginnings",
    title: "New Beginnings",
    description: "Support for people moving through major life transitions and displacement.",
    facilitatorName: "Sven Larsson",
    format: "in_person",
    location: "GESA Center, Paris",
    schedule: "Fridays, 16:00 CET",
    capacity: 10,
  },
  {
    id: "steady-ground",
    title: "Steady Ground",
    description: "A weekly anxiety and stress support group grounded in mindfulness practice.",
    facilitatorName: "Yusuf Demir",
    format: "online",
    location: "Zoom",
    schedule: "Wednesdays, 20:00 GMT",
    capacity: 14,
  },
];
