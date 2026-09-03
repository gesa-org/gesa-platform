import { render, screen } from "@testing-library/react";
import AdminMatchRequestsPage from "@/app/admin/match-requests/page";

// Phase 69 — Roy asked to "avoid double booking with a same time or
// person with one therapist only." Real session_bookings already can't
// collide (see app/api/intake-booking/route.ts's get_booked_slots RPC +
// unique DB constraint), but a match_request's preferred_date/
// preferred_time was just a preference with nothing flagging a collision
// to the admin reviewing it. This tests the new conflict badge added to
// the Find Your Therapist admin list.
const THERAPIST_A = { id: "t1", full_name: "Dr. Therapist A", contact_email: "a@example.com", contact_phone: null };
const THERAPIST_B = { id: "t2", full_name: "Dr. Therapist B", contact_email: "b@example.com", contact_phone: null };

function baseRequest(overrides: Record<string, unknown>) {
  return {
    id: "default-id",
    created_at: "2026-08-20T00:00:00Z",
    email: "client@example.com",
    gender_preference: "no_preference",
    ai_reasoning: null,
    clinic_location_id: null,
    matched_therapist_ids: [],
    name: "Client",
    phone: null,
    preferred_date: null,
    preferred_time: null,
    selected_therapist_id: null,
    session_format: "online",
    status: "new",
    symptoms: [],
    treatment_type: null,
    selected_therapist: null,
    clinic_location: null,
    ...overrides,
  };
}

const mockGetAllMatchRequests = jest.fn();
const mockGetAllSessionBookings = jest.fn();

jest.mock("@/lib/queries", () => ({
  getAllMatchRequests: () => mockGetAllMatchRequests(),
  getAllSessionBookings: () => mockGetAllSessionBookings(),
}));

describe("AdminMatchRequestsPage — booking conflict warnings", () => {
  beforeEach(() => {
    mockGetAllMatchRequests.mockReset();
    mockGetAllSessionBookings.mockReset();
  });

  it("flags a request whose preferred slot is already a real confirmed session for that therapist", async () => {
    mockGetAllMatchRequests.mockResolvedValue([
      baseRequest({
        id: "m1",
        name: "Alex",
        selected_therapist_id: "t1",
        selected_therapist: THERAPIST_A,
        preferred_date: "2026-09-01",
        preferred_time: "14:00",
      }),
    ]);
    mockGetAllSessionBookings.mockResolvedValue([
      { therapist_id: "t1", session_date: "2026-09-01", session_time: "14:00:00" },
    ]);

    const jsx = await AdminMatchRequestsPage();
    render(jsx);

    expect(screen.getByText("This professional is already booked at this time")).toBeInTheDocument();
  });

  it("flags two pending requests both eyeing the same therapist+date+time", async () => {
    mockGetAllMatchRequests.mockResolvedValue([
      baseRequest({
        id: "m1",
        name: "Alex",
        selected_therapist_id: "t1",
        selected_therapist: THERAPIST_A,
        preferred_date: "2026-09-01",
        preferred_time: "14:00",
      }),
      baseRequest({
        id: "m2",
        name: "Sam",
        selected_therapist_id: "t1",
        selected_therapist: THERAPIST_A,
        preferred_date: "2026-09-01",
        preferred_time: "14:00",
      }),
    ]);
    mockGetAllSessionBookings.mockResolvedValue([]);

    const jsx = await AdminMatchRequestsPage();
    render(jsx);

    expect(screen.getAllByText(/Also requested by 1 other for this same slot/)).toHaveLength(2);
  });

  it("does not flag requests for different therapists, different times, or with no preferred time at all", async () => {
    mockGetAllMatchRequests.mockResolvedValue([
      baseRequest({
        id: "m1",
        name: "Alex",
        selected_therapist_id: "t1",
        selected_therapist: THERAPIST_A,
        preferred_date: "2026-09-01",
        preferred_time: "14:00",
      }),
      baseRequest({
        id: "m2",
        name: "Sam",
        selected_therapist_id: "t2",
        selected_therapist: THERAPIST_B,
        preferred_date: "2026-09-01",
        preferred_time: "14:00",
      }),
      baseRequest({
        id: "m3",
        name: "Jordan",
        selected_therapist_id: "t1",
        selected_therapist: THERAPIST_A,
        preferred_date: "2026-09-01",
        preferred_time: "16:00",
      }),
      baseRequest({
        id: "m4",
        name: "No Preference",
        selected_therapist_id: "t1",
        selected_therapist: THERAPIST_A,
        preferred_date: null,
        preferred_time: null,
      }),
    ]);
    mockGetAllSessionBookings.mockResolvedValue([]);

    const jsx = await AdminMatchRequestsPage();
    render(jsx);

    expect(screen.queryByText("This professional is already booked at this time")).not.toBeInTheDocument();
    expect(screen.queryByText(/Also requested by/)).not.toBeInTheDocument();
  });
});
