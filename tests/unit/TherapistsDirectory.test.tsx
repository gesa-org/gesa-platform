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
    expect(screen.getByText("Showing 2 of 2 therapists")).toBeInTheDocument();
  });

  it("filters by name search", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.type(screen.getByPlaceholderText("Find therapist…"), "amir");
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Amir Cohen")).toBeInTheDocument();
  });

  it("filters by language", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "Hebrew");
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Amir Cohen")).toBeInTheDocument();
  });

  it("shows an empty state when no therapist matches the filters", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.type(screen.getByPlaceholderText("Find therapist…"), "nonexistent-name");
    expect(
      screen.getByText(/No therapists match your search right now/i)
    ).toBeInTheDocument();
  });

  // Phase 176 — regression coverage for the "Load more" bug: 34 total
  // therapists (matching the real production count reported), 12 shown
  // initially, clicking "Load more" reveals the next page, the count line
  // and the accessible announcement both update, and the button itself
  // disappears once every eligible therapist is showing. This only tests
  // this component's own pagination logic (already correct before this
  // phase) — the actual bug was a site-wide hydration failure in
  // components/motion/* that left every button's click handler inert; see
  // EXECUTION_PLAN.md Phase 176 and tests/unit/useSafeReducedMotion.test.tsx.
  describe("Load more", () => {
    const many = Array.from({ length: 34 }, (_, i) =>
      makeTherapist({
        id: String(i + 1),
        full_name: `Therapist ${String(i + 1).padStart(2, "0")}`,
      })
    );

    it("shows 12 of 34 initially and reveals more on click, without duplicates", async () => {
      render(<TherapistsDirectory therapists={many} />);
      expect(screen.getByText("Showing 12 of 34 therapists")).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(12);

      await userEvent.click(screen.getByRole("button", { name: /load 12 more therapists/i }));

      expect(screen.getByText("Showing 24 of 34 therapists")).toBeInTheDocument();
      const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      expect(headings).toHaveLength(24);
      expect(new Set(headings).size).toBe(24); // no duplicate cards

      expect(screen.getByRole("status")).toHaveTextContent(
        "12 more therapists loaded. Showing 24 of 34."
      );
    });

    it("removes the button once every eligible therapist is shown", async () => {
      render(<TherapistsDirectory therapists={many} />);
      await userEvent.click(screen.getByRole("button", { name: /load 12 more therapists/i }));
      // 24 shown, 10 remain — the next click's aria-label reflects the
      // smaller final batch, not another full page of 12.
      await userEvent.click(screen.getByRole("button", { name: /load 10 more therapists/i }));

      expect(screen.getByText("Showing 34 of 34 therapists")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
    });

    it("resets pagination and clears the announcement when a filter changes", async () => {
      render(<TherapistsDirectory therapists={many} />);
      await userEvent.click(screen.getByRole("button", { name: /load 12 more therapists/i }));
      expect(screen.getByText("Showing 24 of 34 therapists")).toBeInTheDocument();

      await userEvent.type(screen.getByPlaceholderText("Find therapist…"), "Therapist 01");

      expect(screen.getByText("Showing 1 of 1 therapists")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("");
    });
  });
});
