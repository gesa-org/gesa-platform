import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordPage from "@/app/forgot-password/page";

// Phase 78 — the request-reset step of the new forgot-password flow.
const mockResetPasswordForEmail = jest.fn(async () => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args) },
  }),
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    mockResetPasswordForEmail.mockClear();
  });

  it("calls resetPasswordForEmail with the site's /reset-password redirect and shows the confirmation state", async () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1));
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/reset-password") })
    );

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });

  it("shows a friendly, generic error message when the request itself fails (e.g. rate limiting, network) rather than the raw provider message", async () => {
    // Phase 175 — this used to assert the raw Supabase error string
    // ("Too many requests") was shown verbatim. Roy's spec explicitly asks
    // for backend details to never reach the screen — friendlyForgotPasswordError
    // (lib/auth/authErrors.ts) now maps this to a generic, safe message
    // instead, so this test asserts the mapped copy and that the raw
    // provider string is nowhere on screen.
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: "Too many requests" } });
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Too many reset requests. Please wait a few minutes and try again.")).toBeInTheDocument();
    expect(screen.queryByText("Too many requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });
});
