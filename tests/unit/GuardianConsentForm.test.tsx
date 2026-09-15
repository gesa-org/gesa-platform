import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GuardianConsentForm from "@/components/auth/GuardianConsentForm";

// Phase 214 — the guardian's actual confirm step on /guardian-consent.
// Covers the required-checkbox gate and that a successful confirm shows the
// activated-account success state.
beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true }) } as Response));
});

describe("GuardianConsentForm", () => {
  it("keeps Confirm consent disabled until the guardian checkbox is checked", () => {
    render(<GuardianConsentForm token="raw-token" minorName="Jamie Rivera" />);
    const button = screen.getByRole("button", { name: "Confirm consent" });
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByText(/I am the parent or legal guardian of this user/));
    expect(button).toBeEnabled();
  });

  it("submits the token to the confirm endpoint and shows the success state", async () => {
    render(<GuardianConsentForm token="raw-token" minorName="Jamie Rivera" />);
    fireEvent.click(screen.getByText(/I am the parent or legal guardian of this user/));
    fireEvent.click(screen.getByRole("button", { name: "Confirm consent" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/guardian-consent/confirm",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "raw-token", consent: true }),
        })
      )
    );
    expect(await screen.findByText("Consent confirmed")).toBeInTheDocument();
  });

  it("shows the returned error message when confirmation fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, json: async () => ({ error: "This link has expired." }) } as Response)
    );
    render(<GuardianConsentForm token="raw-token" minorName={null} />);
    fireEvent.click(screen.getByText(/I am the parent or legal guardian of this user/));
    fireEvent.click(screen.getByRole("button", { name: "Confirm consent" }));

    expect(await screen.findByText("This link has expired.")).toBeInTheDocument();
  });
});
