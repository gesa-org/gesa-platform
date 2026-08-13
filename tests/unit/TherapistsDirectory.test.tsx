import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TherapistsDirectory from "@/components/TherapistsDirectory";
import type { Tables } from "@/lib/database.types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    rpc: async () => ({ data: null, error: null }),
  }),
}));

function makeTherapist(overrides: Partial<Tables<"therapists">>): Tables<"therapists"> {
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
    is_active: true,
    verified_at: null,
    verified_by: null,
    profile_id: null,
    photo_url: null,
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
    await userEvent.type(screen.getByPlaceholderText("Search…"), "amir");
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Amir Cohen")).toBeInTheDocument();
  });

  it("filters by language", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.selectOptions(screen.getByText("Language").nextElementSibling as HTMLElement, "Hebrew");
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Amir Cohen")).toBeInTheDocument();
  });

  it("shows an empty state when no therapist matches the filters", async () => {
    render(<TherapistsDirectory therapists={therapists} />);
    await userEvent.type(screen.getByPlaceholderText("Search…"), "nonexistent-name");
    expect(
      screen.getByText(/No therapists match your search right now/i)
    ).toBeInTheDocument();
  });
});
