import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordPage from "@/app/reset-password/page";

// Phase 78 — the set-new-password step of the new forgot-password flow.
// The Supabase browser client is expected to have already exchanged the
// recovery-link code in the URL for a session by the time this page's form
// submits (handled automatically by @supabase/ssr's createBrowserClient,
// not by this component) — this test only covers this page's own logic:
// client-side password-match validation and the updateUser call/result.
const mockUpdateUser = jest.fn(async () => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { updateUser: (...args: unknown[]) => mockUpdateUser(...args) },
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    mockUpdateUser.mockClear();
  });

  it("blocks submission when the two password fields don't match, without calling Supabase", async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpassword2" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("updates the password and shows the confirmation state when both fields match", async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpassword1" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword1" }));
    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login");
  });

  it("shows a real error if the recovery link is invalid or expired", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: { message: "Auth session missing" } });
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpassword1" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Auth session missing")).toBeInTheDocument();
  });
});
