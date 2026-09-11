import { render, screen } from "@testing-library/react";
import TherapistEditForm from "@/components/admin/TherapistEditForm";
import type { TherapistAdminRow } from "@/lib/queries";

// Phase 188 — regression coverage for the "Application error: a client-side
// exception has occurred" crash on /admin/therapists/[id]. Root cause:
// getTherapistByIdAdmin's THERAPIST_ADMIN_LIST_COLUMNS select list was
// missing offers_online/offers_in_person/city/support_pathways, so those
// came back `undefined` on the row this form receives — and
// `supportPathways.includes(...)` (no `?? []` guard at the time) threw
// during render. lib/queries.ts's select list is now fixed, and this form
// now has its own `?? []`/`?? false` guards as a second line of defense —
// this test builds a therapist object with exactly that "columns missing"
// shape (fields absent, not just null) and asserts the form still renders
// instead of throwing.
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
  }),
}));

// A therapist row shaped like the pre-fix bug: support_pathways,
// offers_online, offers_in_person and city are entirely absent, exactly as
// Supabase would return them when a column is left out of `select(...)`
// rather than present-but-null.
const BROKEN_THERAPIST = {
  id: "t-1",
  full_name: "Dana Cohen",
  slug: "dana-cohen",
  bio: null,
  credentials: null,
  country: null,
  contact_email: null,
  contact_phone: null,
  created_at: "2026-01-01T00:00:00Z",
  diary_link: null,
  diary_link_status: "unset",
  gender: null,
  is_active: true,
  is_verified: true,
  languages: null,
  photo_url: null,
  price_note: null,
  profile_id: null,
  session_lengths: null,
  short_summary: null,
  specialties: null,
  time_zone: null,
  tracks: null,
  updated_at: "2026-01-01T00:00:00Z",
  verified_at: null,
  verified_by: null,
  years_experience: null,
  profile_status: "active",
  volunteer_application_id: null,
  linkedAccountEmail: null,
} as unknown as TherapistAdminRow;

describe("TherapistEditForm", () => {
  it("renders without crashing when support_pathways/offers_online/offers_in_person/city are missing from the fetched row", () => {
    render(<TherapistEditForm therapist={BROKEN_THERAPIST} />);
    expect(screen.getByDisplayValue("Dana Cohen")).toBeInTheDocument();
    // None of the intake-pathway checkboxes should be checked, and none of
    // this should have thrown while rendering them.
    expect(screen.getByRole("checkbox", { name: /War \/ crisis/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Online" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "In-person" })).not.toBeChecked();
  });

  it("still renders correctly when those fields are present and populated", () => {
    const therapist = {
      ...BROKEN_THERAPIST,
      support_pathways: ["crisis", "general"],
      offers_online: true,
      offers_in_person: true,
      city: "Tel Aviv",
    } as unknown as TherapistAdminRow;
    render(<TherapistEditForm therapist={therapist} />);
    expect(screen.getByRole("checkbox", { name: /War \/ crisis/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Online" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "In-person" })).toBeChecked();
    expect(screen.getByDisplayValue("Tel Aviv")).toBeInTheDocument();
  });
});
