import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookSessionButton from "@/components/therapists/BookSessionButton";
import type { PublicTherapistRow } from "@/lib/database.types";

// Phase 196 — regression coverage for the new "serviceType" routing this
// phase added to BookSessionButton: Charity Services bookings (no payment
// step) vs Professional Services bookings (a required payment step before
// /api/diary-appointment/confirm is ever called), plus the existing
// cancel-booking path, which now also needs to keep working unchanged for
// both. Every child modal in the diary-link chain (BookingIntakeModal,
// SlotSelectionModal, ScheduleReviewModal, PaymentModal, BookingSuccessModal)
// is stubbed out to a single button that invokes the exact prop callback
// BookSessionButton passed it — the point of this test is BookSessionButton's
// own stage-orchestration logic, not any of those modals' internal UI/
// validation, which each already have (or don't yet need) their own tests.
jest.mock("@/components/intake/IntakeBookingModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/booking/BookingIntakeModal", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: (id: string, details: unknown) => void }) => (
    <button
      onClick={() =>
        onSuccess("intake-1", {
          clientName: "Jane Client",
          clientEmail: "jane@example.com",
          clientPhone: "+1 555 0100",
          clientCity: "New York",
        })
      }
    >
      submit-intake
    </button>
  ),
}));

jest.mock("@/components/booking/SlotSelectionModal", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: (s: unknown) => void }) => (
    <button
      onClick={() =>
        onSuccess({
          selectedDate: "2026-10-01",
          selectedStartTime: "10:00:00",
          selectedEndTime: "11:00:00",
          durationMinutes: 60,
          timeZone: "UTC",
          appointmentType: "online",
        })
      }
    >
      pick-slot
    </button>
  ),
}));

jest.mock("@/components/booking/ScheduleReviewModal", () => ({
  __esModule: true,
  default: ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div>
      <button onClick={onConfirm}>confirm-schedule</button>
      <button onClick={onCancel}>cancel-booking</button>
    </div>
  ),
}));

jest.mock("@/components/booking/PaymentModal", () => ({
  __esModule: true,
  default: ({ onPaid }: { onPaid: () => void }) => <button onClick={onPaid}>simulate-payment-success</button>,
}));

jest.mock("@/components/booking/BookingSuccessModal", () => ({
  __esModule: true,
  default: () => <div>booking-confirmed</div>,
}));

function makeTherapist(overrides: Partial<PublicTherapistRow> = {}): PublicTherapistRow {
  return {
    id: "t-1",
    full_name: "Dr. Jordan Rivers",
    slug: "jordan-rivers",
    bio: null,
    credentials: null,
    gender: null,
    is_verified: true,
    languages: ["English"],
    photo_url: null,
    session_lengths: ["60"],
    short_summary: null,
    specialties: ["Anxiety"],
    time_zone: null,
    tracks: [],
    years_experience: null,
    diary_link: "https://calendar.example.com/jordan",
    diary_link_status: "valid",
    country: null,
    price_note: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    has_whatsapp: false,
    offers_online: true,
    offers_in_person: false,
    city: null,
    support_pathways: [],
    session_price_amount: 80,
    session_price_currency: "USD",
    ...overrides,
  };
}

async function driveToReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /choose a date and time/i }));
  await user.click(screen.getByRole("button", { name: "submit-intake" }));
  await user.click(await screen.findByRole("button", { name: /i selected a time/i }));
  await user.click(await screen.findByRole("button", { name: "pick-slot" }));
  await screen.findByRole("button", { name: "confirm-schedule" });
}

describe("BookSessionButton — Charity/Professional Services routing (Phase 196)", () => {
  const originalOpen = window.open;
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.open = jest.fn(() => ({}) as unknown as Window);
    // Phase 196 — same plain-object fetch mock shape used throughout this
    // test suite (BookingIntakeForm.test.tsx, MatchWizard.test.tsx, etc.)
    // rather than a real `Response` instance, since jsdom's test
    // environment here has no fetch/Response polyfill of its own.
    global.fetch = jest.fn(async (url: RequestInfo | URL) => {
      const href = String(url);
      if (href.includes("/api/diary-scheduling")) {
        return { ok: true, json: async () => ({ id: "event-1" }) };
      }
      if (href.includes("/api/diary-appointment/confirm")) {
        return {
          ok: true,
          json: async () => ({
            therapistName: "Dr. Jordan Rivers",
            selectedDate: "2026-10-01",
            selectedStartTime: "10:00:00",
            durationMinutes: 60,
            timeZone: "UTC",
            referenceNumber: "GESA-EVENT1",
            clientEmail: "jane@example.com",
          }),
        };
      }
      if (href.includes("/api/diary-appointment/cancel")) {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      throw new Error(`Unexpected fetch: ${href}`);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    window.open = originalOpen;
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("charity booking (no serviceType) skips payment and confirms directly", async () => {
    const user = userEvent.setup();
    render(<BookSessionButton therapist={makeTherapist()} serviceType="charity" />);

    await driveToReview(user);
    await user.click(screen.getByRole("button", { name: "confirm-schedule" }));

    // No payment step for Charity Services — /api/diary-appointment/confirm
    // is called immediately, landing straight on the success screen.
    expect(await screen.findByText("booking-confirmed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "simulate-payment-success" })).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/diary-appointment/confirm",
      expect.objectContaining({ body: JSON.stringify({ eventId: "event-1" }) })
    );
  });

  it("professional booking requires a successful payment before confirmation", async () => {
    const user = userEvent.setup();
    render(<BookSessionButton therapist={makeTherapist()} serviceType="professional" />);

    await driveToReview(user);
    await user.click(screen.getByRole("button", { name: "confirm-schedule" }));

    // Confirm should NOT have been called yet — the payment stage sits
    // between "Confirm schedule" and the real finalize call.
    const payButton = await screen.findByRole("button", { name: "simulate-payment-success" });
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/diary-appointment/confirm",
      expect.anything()
    );

    await user.click(payButton);

    expect(await screen.findByText("booking-confirmed")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/diary-appointment/confirm",
      expect.objectContaining({ body: JSON.stringify({ eventId: "event-1" }) })
    );
  });

  it("cancelling from the review screen notifies the server and resets to the start", async () => {
    const user = userEvent.setup();
    render(<BookSessionButton therapist={makeTherapist()} serviceType="professional" />);

    await driveToReview(user);
    await user.click(screen.getByRole("button", { name: "cancel-booking" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/diary-appointment/cancel",
      expect.objectContaining({ body: JSON.stringify({ eventId: "event-1" }) })
    );
    expect(await screen.findByRole("button", { name: /choose a date and time/i })).toBeInTheDocument();
  });
});
