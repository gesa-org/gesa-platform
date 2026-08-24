import { render, screen } from "@testing-library/react";
import AdminOverviewPage from "@/app/admin/page";

// Phase 60 — Roy's reference CRM dashboard mockup replaced the plain tile
// grid with a trend chart, an activity feed, two Key Metrics panels, and a
// scheduling calendar, all built from real data via lib/queries.ts. This is
// an async Server Component, so — same pattern as tests/unit/AboutPage.test
// from Phase 58 — the query module is mocked and AdminOverviewPage() is
// awaited directly before rendering, rather than hitting a real Supabase
// project.
const NOW = new Date("2026-08-24T12:00:00Z");

jest.mock("@/lib/queries", () => ({
  getAllInquiries: jest.fn(async () => [
    { id: "i1", created_at: "2026-08-23T00:00:00Z", email: "asker@example.com", message: "hi", name: "Asker", type: "General" },
  ]),
  getAllBookingRequests: jest.fn(async () => [
    { id: "b1", created_at: "2026-08-22T00:00:00Z", email: "booker@example.com", entry_route: "general", name: "Booker", status: "new", matched_therapist: null },
  ]),
  getAllGroupRegistrations: jest.fn(async () => [
    { id: "g1", created_at: "2026-08-20T00:00:00Z", email: "group@example.com", group_id: "grp1", name: "Groupie", phone: null },
  ]),
  getAllProfiles: jest.fn(async () => [
    { id: "p1", created_at: "2026-08-22T00:00:00Z", email: "admin@gesa.org", full_name: "Admin One", role: "admin", country: null, phone: null, preferred_language: null, updated_at: "2026-08-22T00:00:00Z" },
    { id: "p2", created_at: "2020-01-01T00:00:00Z", email: "client@gesa.org", full_name: "Client One", role: "client", country: null, phone: null, preferred_language: null, updated_at: "2020-01-01T00:00:00Z" },
  ]),
  getAllMatchRequests: jest.fn(async () => [
    {
      id: "m1",
      created_at: "2026-08-24T00:00:00Z",
      email: "matchme@example.com",
      status: "new",
      name: "Match Requester",
      gender_preference: "no_preference",
      ai_reasoning: null,
      clinic_location_id: null,
      matched_therapist_ids: [],
      phone: null,
      preferred_date: null,
      preferred_time: null,
      selected_therapist_id: null,
      session_format: "online",
      symptoms: [],
      treatment_type: null,
      selected_therapist: null,
      clinic_location: null,
    },
  ]),
  getAllSessionBookings: jest.fn(async () => [
    {
      id: "s1",
      created_at: "2026-08-21T00:00:00Z",
      therapist_id: "t1",
      client_name: "Client One",
      client_email: "client1@example.com",
      client_phone: null,
      client_city: null,
      client_birth_year: null,
      agreed_terms_at: null,
      agreed_privacy_at: null,
      session_date: "2026-08-15",
      session_time: "10:00:00",
      contact_channel: "email",
      path: null,
      status: "confirmed",
      therapist: { id: "t1", full_name: "Dr. Therapist", contact_email: "t@example.com" },
    },
  ]),
}));

describe("AdminOverviewPage", () => {
  const originalNow = Date.now;

  beforeAll(() => {
    Date.now = () => NOW.getTime();
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  it("renders the KPI tiles, trend chart, activity feed, key metrics, and scheduling calendar with real query data", async () => {
    const jsx = await AdminOverviewPage();
    render(jsx);

    // KPI tiles — "Booking requests" appears twice (the KPI tile and the
    // Key Metrics "Requests" bar below), so that one is checked with
    // getAllByText rather than assuming a single match.
    expect(screen.getByText("Session bookings")).toBeInTheDocument();
    expect(screen.getByText("Find Your Therapist")).toBeInTheDocument();
    expect(screen.getAllByText("Booking requests").length).toBe(2);

    // Trend chart renders as an accessible SVG with real month buckets
    expect(screen.getByRole("img", { name: "Monthly activity trend" })).toBeInTheDocument();

    // User Activity feed — most recent item (the match request, created
    // 2026-08-24, same as "now") should appear with its real email.
    expect(screen.getByText("matchme@example.com")).toBeInTheDocument();
    expect(screen.getByText("client1@example.com")).toBeInTheDocument();

    // Key Metrics — Requests bars
    expect(screen.getByText("Requests")).toBeInTheDocument();
    expect(screen.getByText("Contact inquiries")).toBeInTheDocument();
    expect(screen.getByText("Group registrations")).toBeInTheDocument();

    // Key Metrics — Community panel, real counts from the mocked profiles
    expect(screen.getByText("Community")).toBeInTheDocument();
    // "2" (profiles.length) also matches a bare calendar day number
    // elsewhere on the page, so this checks it specifically inside the
    // Registered users figure rather than asserting the text globally.
    const registeredUsersLabel = screen.getByText("Registered users");
    expect(registeredUsersLabel.parentElement?.textContent).toContain("2");
    expect(screen.getByText("1 new this week")).toBeInTheDocument(); // only p1 is within 7 days of NOW
    expect(screen.getByText(/admin:/)).toBeInTheDocument();
    expect(screen.getByText(/client:/)).toBeInTheDocument();

    // Scheduling Overview — the mocked session is dated in the current
    // month, so it should count toward "this month" and appear on the grid.
    expect(screen.getByText("Scheduling Overview")).toBeInTheDocument();
    expect(screen.getByText("Session bookings this month")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });
});
