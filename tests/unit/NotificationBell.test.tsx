import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationBell from "@/components/admin/NotificationBell";

// Phase 69 — volunteer applications (therapist_applications) and group
// registrations were both entirely missing from this bell's feed before,
// even though every other admin-reviewed submission type already appeared
// here. This mocks the Supabase client's chainable query builder generically
// per table, since the component calls a different combination of
// .select/.order/.limit/.eq per table.
const mockTableData: Record<string, unknown[]> = {
  match_requests: [],
  booking_requests: [],
  inquiries: [],
  session_bookings: [],
  therapist_applications: [
    {
      id: "v1",
      full_name: "Jamie Rivera",
      email: "jamie@example.com",
      specialties: ["CBT", "Group Sessions"],
      languages: ["English", "Spanish"],
      meeting_duration: "45",
      status: "new",
      created_at: "2026-08-24T10:00:00Z",
    },
  ],
  group_registrations: [
    {
      id: "g1",
      name: "Group Person",
      email: "groupperson@example.com",
      group_id: "grief-support-circle",
      created_at: "2026-08-24T09:00:00Z",
    },
  ],
};

function mockMakeChain(table: string) {
  const rows = mockTableData[table] ?? [];
  const chain = {
    select: () => chain,
    order: () => chain,
    limit: () => Promise.resolve({ data: rows }),
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
  };
  return chain;
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "admin-user-1" } } }),
    },
    from: (table: string) => mockMakeChain(table),
  }),
}));

describe("NotificationBell", () => {
  it("includes volunteer applications and group registrations in the admin feed", async () => {
    render(<NotificationBell />);

    // Open the bell — items only render once the dropdown is open.
    const bellButton = await screen.findByRole("button", { name: /notification/i });
    fireEvent.click(bellButton);

    await waitFor(() => expect(screen.getByText(/New volunteer application — Jamie Rivera/)).toBeInTheDocument());
    expect(screen.getByText(/New group registration — Group Person/)).toBeInTheDocument();
  });

  it("shows the volunteer's specialties/languages/meeting duration in the detail modal", async () => {
    render(<NotificationBell />);
    const bellButton = await screen.findByRole("button", { name: /notification/i });
    fireEvent.click(bellButton);

    const volunteerItem = await screen.findByText(/New volunteer application — Jamie Rivera/);
    fireEvent.click(volunteerItem);

    expect(await screen.findByText("Jamie Rivera")).toBeInTheDocument();
    expect(screen.getByText("CBT, Group Sessions")).toBeInTheDocument();
    expect(screen.getByText("English, Spanish")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("shows the group registration's group in the detail modal", async () => {
    render(<NotificationBell />);
    const bellButton = await screen.findByRole("button", { name: /notification/i });
    fireEvent.click(bellButton);

    const groupItem = await screen.findByText(/New group registration — Group Person/);
    fireEvent.click(groupItem);

    expect(await screen.findByText("grief-support-circle")).toBeInTheDocument();
  });
});
