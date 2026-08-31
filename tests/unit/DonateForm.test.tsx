import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DonateForm from "@/components/donate/DonateForm";
import { DONATE_PAGE_FALLBACK } from "@/components/donate/DonatePage";

// Phase 98 — the interactive giving box on the /donate page.
// Phase 99 — rewritten for the real Mollie checkout flow: confirming the
// gift now posts to /api/donations/create-payment and redirects the
// browser to the returned Mollie checkout URL, instead of inserting
// directly into Supabase from the client. `fetch` and `window.location` are
// mocked so no real network call or navigation happens in the test.
const mockFetch = jest.fn();

// jsdom throws "Not implemented: navigation" if a test lets a real
// assignment to window.location.href go through — replace it with a
// writable stub so DonateForm's redirect can be asserted instead.
const originalLocation = window.location;

describe("DonateForm", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    // @ts-expect-error — reassigning window.location for the test only.
    delete window.location;
    // @ts-expect-error — partial Location stub, only `href` is exercised.
    window.location = { href: "" };
  });

  afterEach(() => {
    // @ts-expect-error — restoring the real Location object stubbed above.
    window.location = originalLocation;
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
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("opens the contact-confirmation modal once a preset amount is selected, then redirects to the returned Mollie checkout URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkoutUrl: "https://www.mollie.com/checkout/select-method/abc123" }),
    });

    render(<DonateForm content={DONATE_PAGE_FALLBACK} />);

    fireEvent.click(screen.getByRole("radio", { name: "Give monthly" }));
    fireEvent.click(screen.getByText("€50"));
    fireEvent.click(screen.getByText("Make my gift"));

    expect(await screen.findByText("Confirm your gift")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Dana Cohen" } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "dana@example.com" } });
    fireEvent.click(screen.getByText("Continue to payment"));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/donations/create-payment");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      fullName: "Dana Cohen",
      email: "dana@example.com",
      frequency: "monthly",
      amount: 50,
      amountChoice: "50",
    });

    await waitFor(() => expect(window.location.href).toBe("https://www.mollie.com/checkout/select-method/abc123"));
  });

  it("shows a real error and does not redirect if the server can't start checkout", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Donations aren't connected to a payment processor yet." }),
    });

    render(<DonateForm content={DONATE_PAGE_FALLBACK} />);
    fireEvent.click(screen.getByText("€25"));
    fireEvent.click(screen.getByText("Make my gift"));

    fireEvent.change(await screen.findByLabelText(/Full name/), { target: { value: "Sam Lee" } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "sam@example.com" } });
    fireEvent.click(screen.getByText("Continue to payment"));

    expect(await screen.findByText("Donations aren't connected to a payment processor yet.")).toBeInTheDocument();
    expect(window.location.href).toBe("");
  });

  it("sends amount_choice \"custom\" with the typed numeric amount for a custom gift", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkoutUrl: "https://www.mollie.com/checkout/select-method/xyz789" }),
    });

    render(<DonateForm content={DONATE_PAGE_FALLBACK} />);

    fireEvent.click(screen.getByText("Custom amount"));
    fireEvent.change(screen.getByLabelText(/Custom gift amount/), { target: { value: "175" } });
    fireEvent.click(screen.getByText("Make my gift"));

    expect(await screen.findByText("Confirm your gift")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Sam Lee" } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "sam@example.com" } });
    fireEvent.click(screen.getByText("Continue to payment"));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ frequency: "once", amount: 175, amountChoice: "custom" });
  });
});
