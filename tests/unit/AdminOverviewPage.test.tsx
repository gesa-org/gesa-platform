import { render, screen, fireEvent } from "@testing-library/react";
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
  // Phase 69 — previously missing from this mock entirely, meaning
  // AdminOverviewPage() would have thrown calling an undefined function
  // the moment volunteer applications were wired into the dashboard.
  getAllTherapistApplications: jest.fn(async () => [
    {
      id: "v1",
      created_at: "2026-08-19T00:00:00Z",
      full_name: "Volunteer One",
      email: "volunteer@example.com",
      phone: null,
      credentials_proof: "LMFT #999",
      specialties: ["CBT"],
      languages: ["English"],
      meeting_duration: "45",
      bio: "Ten years of practice.",
      status: "new",
      notes: null,
      reviewed_at: null,
      reviewed_by: null,
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

    // KPI tiles — "Booking requests" and "Find Your Therapist" each appear
    // more than once now (KPI tile + Requests bar / calendar legend), so
    // those are checked with getAllByText rather than assuming one match.
    expect(screen.getByText("Session bookings")).toBeInTheDocument();
    expect(screen.getAllByText("Find Your Therapist").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Booking requests").length).toBeGreaterThanOrEqual(2);
    // Phase 69 — new 4th KPI tile; also appears in the Requests panel and
    // the calendar legend, so >=2 rather than exactly 1.
    expect(screen.getAllByText("Volunteer applicants").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("volunteer@example.com")).toBeInTheDocument();

    // Trend chart renders as an accessible SVG with real month buckets
    expect(screen.getByRole("img", { name: "Monthly activity trend" })).toBeInTheDocument();

    // User Activity feed — most recent item (the match request, created
    // 2026-08-24, same as "now") should appear with its real email.
    expect(screen.getByText("matchme@example.com")).toBeInTheDocument();
    expect(screen.getByText("client1@example.com")).toBeInTheDocument();

    // Key Metrics — Requests bars
    expect(screen.getByText("Requests")).toBeInTheDocument();
    expect(screen.getByText("Contact inquiries")).toBeInTheDocument();
    // "Group registrations" now also appears as a calendar legend label.
    expect(screen.getAllByText("Group registrations").length).toBeGreaterThanOrEqual(2);

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

    // Scheduling Overview — Phase 61 merged every real date-bearing source
    // (session, match request, booking request, inquiry, group
    // registration); Phase 69 added volunteer applications as a 6th. All
    // six mocked items fall in the current month (Aug 2026), so "Logged
    // this month" should read 6 — checked scoped to its own label's
    // sibling rather than the bare page, since a lone "6" could otherwise
    // also match a calendar day number elsewhere on the grid.
    expect(screen.getByText("Scheduling Overview")).toBeInTheDocument();
    const loggedThisMonthLabel = screen.getByText("Logged this month");
    expect(loggedThisMonthLabel.parentElement?.textContent).toContain("6");

    // Phase 63 — the calendar day cell no longer carries the event details
    // directly in its title tooltip; clicking it opens a day-view modal
    // instead (Google-Calendar-style). Clicking the mocked session's real
    // date (Aug 15) should surface its real details there.
    fireEvent.click(screen.getByRole("button", { name: "15" }));
    expect(screen.getByText(/Client One with Dr\. Therapist/)).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();

    // User Activity is now a fixed-height, scrollable container (Phase 61)
    // rather than a static list, since it will only keep growing.
    const activityHeading = screen.getByText("User Activity");
    // The heading sits in its own flex row (heading + "N total" count),
    // itself a sibling of the scrollable list — go up to that shared card
    // container before looking for the scroll area.
    const activityCard = activityHeading.parentElement?.parentElement;
    const scrollContainer = activityCard?.querySelector(".overflow-y-auto");
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.className).toContain("max-h-");
  });
});

// Phase 69 — the email-config health check reads process.env directly
// (server-only; the actual key/inbox values are never rendered, only
// whether they're present), so these tests manipulate process.env around
// each case rather than mocking anything.
describe("AdminOverviewPage — email delivery config warning", () => {
  const originalNow = Date.now;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    Date.now = () => NOW.getTime();
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("warns when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.GESA_CONTACT_INBOX;

    const jsx = await AdminOverviewPage();
    render(jsx);

    expect(screen.getByText("Email delivery isn't fully configured")).toBeInTheDocument();
    expect(screen.getByText(/RESEND_API_KEY is not set/)).toBeInTheDocument();
    // Only the RESEND_API_KEY warning shows — the inbox-fallback warning is
    // conditional on the key already being set, so it shouldn't double up.
    expect(screen.queryByText(/GESA_CONTACT_INBOX is not set/)).not.toBeInTheDocument();
  });

  it("warns about the placeholder inbox when the key is set but the inbox isn't", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.GESA_CONTACT_INBOX;

    const jsx = await AdminOverviewPage();
    render(jsx);

    expect(screen.getByText(/GESA_CONTACT_INBOX is not set/)).toBeInTheDocument();
    expect(screen.queryByText(/RESEND_API_KEY is not set/)).not.toBeInTheDocument();
  });

  it("shows no warning at all once both are configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.GESA_CONTACT_INBOX = "hello@realaddress.org";

    const jsx = await AdminOverviewPage();
    render(jsx);

    expect(screen.queryByText("Email delivery isn't fully configured")).not.toBeInTheDocument();
  });
});
