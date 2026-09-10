import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TherapistsDirectory from "@/components/TherapistsDirectory";
import type { PublicTherapistRow } from "@/lib/database.types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    rpc: async () => ({ data: null, error: null }),
  }),
}));

function makeTherapist(overrides: Partial<PublicTherapistRow>): PublicTherapistRow {
  return {
    id: overrides.id ?? "1",
    slug: "jane-doe",
    full_name: "Jane Doe",
    bio: null,
    short_summary: "Warm, trauma-informed support.",
    specialties: ["Trauma Support"],
    languages: ["English"],
    gender: "no_preference",
    time_zone: null,
    session_lengths: ["60"],
    tracks: [],
    years_experience: null,
    credentials: null,
    is_verified: true,
    photo_url: null,
    country: null,
    diary_link: null,
    diary_link_status: "unset",
    price_note: null,
    has_whatsapp: false,
    // Phase 151 — new required fields (see the
    // add_browse_search_columns_to_therapists migration); this fixture
    // predates that phase, so defaults are added here rather than making
    // the type itself optional and letting a real missing value slip by
    // unnoticed elsewhere.
    offers_online: true,
    offers_in_person: false,
    city: null,
    // Phase 152 — new required field (see the
    // add_support_pathways_to_therapists migration); default added here for
    // the same reason as offers_online/offers_in_person/city above.
    support_pathways: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const therapists = [
  makeTherapist({ id: "1", full_name: "Jane Doe", specialties: ["Trauma Support"], languages: ["English"] }),
  makeTherapist({ id: "2", full_name: "Amir Cohen", specialties: ["CBT"], languages: ["Hebrew", "English"] }),
];

describe("TherapistsDirectory", () => {
  it("shows all therapists with no filters applied", () => {
    render(<TherapistsDirectory therapists={therapists} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Amir Cohen")).toBeInTheDocument();
    // Phase 180 — unfiltered count reads "Showing all N active therapists",
    // not "Showing N of N" — there's no separate "total" to compare against
    // until a filter/search is actually applied.
    expect(screen.getByText("Showing all 2 active therapists")).toBeInTheDocument();
  });

  it("filters by name search", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.type(screen.getByPlaceholderText("Find therapist…"), "amir");
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Amir Cohen")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 2 active therapists")).toBeInTheDocument();
  });

  it("filters by language", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "Hebrew");
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Amir Cohen")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 2 active therapists")).toBeInTheDocument();
  });

  it("shows an empty state when no therapist matches the filters", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.type(screen.getByPlaceholderText("Find therapist…"), "nonexistent-name");
    // Phase 180 — the count line itself now states the no-match message
    // directly (Roy's spec), separate from the larger empty-state box
    // (content.noResultsMessage) rendered below it.
    expect(screen.getByText("No therapists match your current filters.")).toBeInTheDocument();
    expect(
      screen.getByText(/No therapists match your search right now/i)
    ).toBeInTheDocument();
  });

  // Phase 180 — Roy asked for "Load more" pagination to be removed entirely:
  // it was unreliable and the "Showing X of Y" line could drift from the
  // actual on-screen card count. Every matching therapist now renders in a
  // single pass, with no button, no hidden window, and no separate
  // load-more announcement anywhere in the DOM.
  describe("no pagination", () => {
    const many = Array.from({ length: 34 }, (_, i) =>
      makeTherapist({
        id: String(i + 1),
        full_name: `Therapist ${String(i + 1).padStart(2, "0")}`,
      })
    );

    it("renders all 34 therapists at once, with an accurate count and no Load more button", () => {
      render(<TherapistsDirectory therapists={many} />);

      expect(screen.getByText("Showing all 34 active therapists")).toBeInTheDocument();
      const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      expect(headings).toHaveLength(34);
      expect(new Set(headings).size).toBe(34); // no duplicate cards

      expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/more therapists loaded/i)).not.toBeInTheDocument();
    });

    it("keeps the full matching set visible (no cap) once a filter narrows the list", async () => {
      render(<TherapistsDirectory therapists={many} />);
      await userEvent.type(screen.getByPlaceholderText("Find therapist…"), "Therapist");

      expect(screen.getByText("Showing 34 of 34 active therapists")).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(34);
      expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
    });
  });
});
