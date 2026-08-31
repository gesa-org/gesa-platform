import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DonateForm from "@/components/donate/DonateForm";
import { DONATE_PAGE_FALLBACK } from "@/components/donate/DonatePage";

// Phase 98 — the interactive giving box on the new /donate page. There's no
// real payment processor connected, so the meaningful behavior to test is
// that picking an amount/frequency and submitting actually saves a real row
// to the `donations` table (same insert-then-thank-you pattern as
// VolunteerApplicationModal.test.tsx, mocked the same way) rather than being
// a dead button.
const mockInsert = jest.fn(async (_payload: Record<string, unknown>) => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

describe("DonateForm", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    // @ts-expect-error — jsdom has no real fetch; the post-submit
    // notification email call is fire-and-forget and best-effort.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  });

  it("renders the frequency toggle and the three preset amounts plus a custom option", () => {
    render(<DonateForm content={DONATE_PAGE_FALLBACK} />);

    expect(screen.getByRole("radio", { name: "Give once" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Give monthly" })).toBeInTheDocument();
    expect(screen.getByText("€25")).toBeInTheDocument();
    expect(screen.getByText("€50")).toBeInTheDocument();
    expect(screen.getByText("€100")).toBeInTheDocument();
    expect(screen.getByText("Custom amount")).toBeInTheDocument();
  });

  it("reveals a numeric input when Custom amount is picked, and blocks submit with no amount chosen", () => {
    render(<DonateForm content={DONATE_PAGE_FALLBACK} />);
    expect(screen.queryByLabelText(/Custom gift amount/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Custom amount"));
    expect(screen.getByLabelText(/Custom gift amount/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Make my gift"));
    expect(screen.getByText("Please choose or enter a gift amount.")).toBeInTheDocument();
    expect(screen.queryByText("Confirm your gift")).not.toBeInTheDocument();
  });

  it("opens the contact-confirmation modal once a preset amount is selected, and saves the pledge to the donations table", async () => {
    render(<DonateForm content={DONATE_PAGE_FALLBACK} />);

    fireEvent.click(screen.getByRole("radio", { name: "Give monthly" }));
    fireEvent.click(screen.getByText("€50"));
    fireEvent.click(screen.getByText("Make my gift"));

    expect(await screen.findByText("Confirm your gift")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Dana Cohen" } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "dana@example.com" } });
    fireEvent.click(screen.getByText("Confirm pledge"));

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      full_name: "Dana Cohen",
      email: "dana@example.com",
      frequency: "monthly",
      amount: 50,
      amount_choice: "50",
    });

    expect(await screen.findByText(/Thank you, Dana Cohen/)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/email/donation", expect.objectContaining({ method: "POST" }));
  });

  it("saves a custom amount as amount_choice \"custom\" with the typed numeric amount", async () => {
    render(<DonateForm content={DONATE_PAGE_FALLBACK} />);

    fireEvent.click(screen.getByText("Custom amount"));
    fireEvent.change(screen.getByLabelText(/Custom gift amount/), { target: { value: "175" } });
    fireEvent.click(screen.getByText("Make my gift"));

    expect(await screen.findByText("Confirm your gift")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Sam Lee" } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "sam@example.com" } });
    fireEvent.click(screen.getByText("Confirm pledge"));

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      frequency: "once",
      amount: 175,
      amount_choice: "custom",
    });
  });
});
