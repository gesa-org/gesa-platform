import { render, screen } from "@testing-library/react";
import MyBookingsPage from "@/app/account/bookings/page";

// Phase 179 — same pattern as tests/unit/AdminOverviewPage.test.tsx: this is
// an async Server Component, so requireUser() and the query module are both
// mocked and the page function is awaited directly before rendering, rather
// than hitting a real Supabase project or exercising the redirect() branch.
const mockRequireUser = jest.fn(async () => ({
  id: "client-profile-1",
  email: "client@example.com",
  full_name: "Test Client",
  role: "client",
  phone: null,
  country: null,
  preferred_language: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}));

jest.mock("@/lib/auth/requireUser", () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}));

const mockGetMyBookings = jest.fn();

jest.mock("@/lib/queries", () => ({
  getMyBookings: (...args: unknown[]) => mockGetMyBookings(...args),
}));

const NOW = new Date("2026-09-10T12:00:00Z");

describe("MyBookingsPage", () => {
  const originalNow = Date.now;

  beforeAll(() => {
    Date.now = () => NOW.getTime();
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes the signed-in profile's id to getMyBookings, scoping the query to this account", async () => {
    mockGetMyBookings.mockResolvedValue([]);
    await MyBookingsPage();
    expect(mockGetMyBookings).toHaveBeenCalledWith("client-profile-1");
  });

  it("shows an empty state when the account has no linked bookings", async () => {
    mockGetMyBookings.mockResolvedValue([]);
    const jsx = await MyBookingsPage();
    render(jsx);
    expect(
      screen.getByText(/don't have any bookings linked to this account yet/)
    ).toBeInTheDocument();
  });

  it("splits bookings into upcoming and past/other, with therapist name and status", async () => {
    mockGetMyBookings.mockResolvedValue([
      {
        id: "b-upcoming",
        session_date: "2026-09-20",
        session_time: "14:00:00",
        contact_channel: "zoom",
        status: "confirmed",
        therapist: { id: "t1", full_name: "Dr. Upcoming", contact_email: "up@example.com" },
      },
      {
        id: "b-past",
        session_date: "2026-01-05",
        session_time: "09:00:00",
        contact_channel: "email",
        status: "confirmed",
        therapist: { id: "t2", full_name: "Dr. Past", contact_email: "past@example.com" },
      },
      {
        id: "b-cancelled",
        session_date: "2026-09-25",
        session_time: "11:00:00",
        contact_channel: "email",
        status: "cancelled",
        therapist: { id: "t3", full_name: "Dr. Cancelled", contact_email: "cancel@example.com" },
      },
    ]);

    const jsx = await MyBookingsPage();
    render(jsx);

    expect(screen.getByText("Dr. Upcoming")).toBeInTheDocument();
    expect(screen.getByText(/2026-09-20 at 14:00/)).toBeInTheDocument();

    // A cancelled booking with a future date still lands in "Past & other
    // bookings", not "Upcoming sessions" — only status === "confirmed" AND
    // a future/today date counts as upcoming.
    expect(screen.getByText("Dr. Past")).toBeInTheDocument();
    expect(screen.getByText("Dr. Cancelled")).toBeInTheDocument();
    const pastSection = screen.getByText("Past & other bookings").closest("div");
    expect(pastSection?.textContent).toContain("Dr. Past");
    expect(pastSection?.textContent).toContain("Dr. Cancelled");
    expect(pastSection?.textContent).not.toContain("Dr. Upcoming");

    expect(screen.getAllByText("Confirmed").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("falls back to a generic label when the linked therapist record is missing", async () => {
    mockGetMyBookings.mockResolvedValue([
      {
        id: "b-no-therapist",
        session_date: "2026-09-20",
        session_time: "14:00:00",
        contact_channel: "email",
        status: "confirmed",
        therapist: null,
      },
    ]);

    const jsx = await MyBookingsPage();
    render(jsx);

    expect(screen.getByText("Your therapist")).toBeInTheDocument();
  });
});
