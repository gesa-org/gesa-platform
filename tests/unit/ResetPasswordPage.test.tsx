import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordPage from "@/app/reset-password/page";

// Phase 78 — the set-new-password step of the forgot-password flow. The
// Supabase browser client is expected to have already exchanged the
// recovery-link code in the URL for a session by the time this page's form
// submits (handled automatically by @supabase/ssr's createBrowserClient,
// not by this component) — this test only covers this page's own logic:
// client-side password-match/strength validation and the updateUser
// call/result.
//
// Phase 175 — fixtures switched from "newpassword1" (12 chars, no
// uppercase, no symbol) to a compliant password, since this page now
// enforces the same 12-char/upper/lower/number/symbol policy as Sign Up
// (lib/auth/passwordPolicy.ts) — the old fixture would now be rejected by
// the new "Choose a stronger password..." branch before ever reaching
// Supabase. Also added: a mock for `signOut`, since a successful reset now
// calls `supabase.auth.signOut({ scope: "others" })` to revoke other
// sessions; and updated the invalid-link assertion to match the new
// friendly-error copy (lib/auth/authErrors.ts) instead of the raw Supabase
// string the page used to show verbatim.
const COMPLIANT_PASSWORD = "NewPassw0rd!23";

const mockUpdateUser = jest.fn(async () => ({ error: null }));
const mockSignOut = jest.fn(async () => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    mockUpdateUser.mockClear();
    mockSignOut.mockClear();
  });

  it("blocks submission when the two password fields don't match, without calling Supabase", async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "SomethingElse1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("blocks submission when the password doesn't meet the strength policy, without calling Supabase", async () => {
    render(<ResetPasswordPage />);

    // 12+ chars but no uppercase and no symbol — fails the policy.
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpassword1" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Choose a stronger password that meets the requirements below.")).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("updates the password, revokes other sessions, and shows the confirmation state when both fields match and are strong enough", async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ password: COMPLIANT_PASSWORD }));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledWith({ scope: "others" }));
    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login");
  });

  it("shows a calm message and a 'request a new link' CTA if the recovery link is invalid or expired", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: { message: "Auth session missing" } });
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("This reset link is no longer valid. Request a new password reset link.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new password reset link" })).toHaveAttribute("href", "/forgot-password");
    // A failed reset should never revoke other sessions.
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("lets New password and Confirm new password be shown/hidden independently", () => {
    render(<ResetPasswordPage />);

    const newPasswordInput = screen.getByLabelText("New password");
    const confirmInput = screen.getByLabelText("Confirm new password");
    expect(newPasswordInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(newPasswordInput).toHaveAttribute("type", "text");
    expect(confirmInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(newPasswordInput).toHaveAttribute("type", "password");
  });
});
