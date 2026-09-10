import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookingIntakeForm from "@/components/booking/BookingIntakeForm";

// Phase 183 — regression coverage for the "Before you book your session"
// consent links, which used to point at planetherapyglobal.org's external
// Terms & Conditions / Privacy Policy pages instead of GESA's own
// /terms-and-conditions and /privacy-policy routes. Mocks PhoneNumberInput
// (its own real implementation pulls in libphonenumber-js's full country
// table, which isn't the point of this test) as a plain controlled input,
// same spirit as ImageUploadField.test.tsx mocking heavy sub-components.
jest.mock("@/components/ui/PhoneNumberInput", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (e164: string, isValid: boolean) => void }) => (
    <input
      aria-label="Phone Number *"
      onChange={(e) => onChange(e.target.value, e.target.value.length > 3)}
    />
  ),
}));

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Jamie Rivera" } });
  fireEvent.change(screen.getByLabelText(/Phone Number/), { target: { value: "+15551234567" } });
  fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: "jamie@example.com" } });
  fireEvent.change(screen.getByLabelText(/City \/ Address/), { target: { value: "Austin, TX" } });
  fireEvent.change(screen.getByLabelText(/Year of Birth/), { target: { value: "1990" } });
  fireEvent.change(screen.getByLabelText(/Did you participate/), { target: { value: "no" } });
  fireEvent.change(screen.getByLabelText(/How many sessions/), { target: { value: "1" } });
}

describe("BookingIntakeForm — legal consent links", () => {
  beforeEach(() => {
    // @ts-expect-error — jsdom has no real fetch.
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ id: "intake-1" }) }));
  });

  it("links Terms & Conditions to GESA's own internal route, not planetherapyglobal.org", () => {
    render(<BookingIntakeForm therapistId="t1" therapistName="Dr. Test" onCancel={jest.fn()} onSuccess={jest.fn()} />);
    const termsLink = screen.getByRole("link", { name: "Terms & Conditions" });
    expect(termsLink).toHaveAttribute("href", "/terms-and-conditions");
    expect(termsLink.getAttribute("href")).not.toMatch(/planetherapy/i);
  });

  it("links Privacy Policy to GESA's own internal route, not planetherapyglobal.org", () => {
    render(<BookingIntakeForm therapistId="t1" therapistName="Dr. Test" onCancel={jest.fn()} onSuccess={jest.fn()} />);
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(privacyLink).toHaveAttribute("href", "/privacy-policy");
    expect(privacyLink.getAttribute("href")).not.toMatch(/planetherapy/i);
  });

  it("keeps both consent links keyboard-focusable and distinguishable from each other", () => {
    render(<BookingIntakeForm therapistId="t1" therapistName="Dr. Test" onCancel={jest.fn()} onSuccess={jest.fn()} />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/terms-and-conditions");
    expect(hrefs).toContain("/privacy-policy");
    // Real, distinct <a>/next-link elements — not two links sharing one href.
    expect(new Set(hrefs).size).toBeGreaterThanOrEqual(2);
  });

  it("blocks submission until both consent checkboxes are checked, and does not call the API", async () => {
    const onSuccess = jest.fn();
    render(<BookingIntakeForm therapistId="t1" therapistName="Dr. Test" onCancel={jest.fn()} onSuccess={onSuccess} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /Continue to calendar/i }));

    expect(await screen.findByText("You must agree to the terms and conditions.")).toBeInTheDocument();
    expect(screen.getByText("You must confirm the privacy policy.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("submits once every required field and both checkboxes are filled in", async () => {
    const onSuccess = jest.fn();
    render(<BookingIntakeForm therapistId="t1" therapistName="Dr. Test" onCancel={jest.fn()} onSuccess={onSuccess} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("checkbox", { name: /agree to the website's Terms & Conditions/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /read and understood the Privacy Policy/i }));

    fireEvent.click(screen.getByRole("button", { name: /Continue to calendar/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("intake-1", expect.any(Object)));
    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body);
    expect(body.agreedTerms).toBe(true);
    expect(body.agreedPrivacy).toBe(true);
  });
});
