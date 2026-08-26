import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HelpUsGrowForm from "@/components/footer/HelpUsGrowForm";

// Phase 70 — the footer's new "Help us grow" mini-form reuses the existing
// "inquiries" table (type: "Help us grow") rather than a new one. This
// mirrors the mock pattern already used for VolunteerApplicationModal's
// Supabase insert.
const mockInsert = jest.fn(async () => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

const originalFetch = global.fetch;

describe("HelpUsGrowForm", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    global.fetch = jest.fn(async () => ({ ok: true })) as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("blocks submission until the 18+/privacy-policy consent checkbox is checked", async () => {
    render(<HelpUsGrowForm />);

    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Jamie Rivera" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "jamie@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Sent" }));

    expect(await screen.findByText(/Please confirm you're over 18/)).toBeInTheDocument();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("saves the submission to the inquiries table with type 'Help us grow' once consent is given", async () => {
    render(<HelpUsGrowForm />);

    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Jamie Rivera" } });
    fireEvent.change(screen.getByPlaceholderText("Phone"), { target: { value: "555-0100" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "jamie@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Sent" }));

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jamie Rivera",
        phone: "555-0100",
        email: "jamie@example.com",
        type: "Help us grow",
      })
    );

    expect(await screen.findByText(/Thank you/)).toBeInTheDocument();
  });
});
