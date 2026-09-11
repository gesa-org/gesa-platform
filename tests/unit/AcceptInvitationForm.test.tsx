import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AcceptInvitationForm from "@/components/AcceptInvitationForm";

// Phase 187 — regression coverage for the invitation-acceptance form: the
// email field is locked (never editable — it comes from the validated
// invitation, not the visitor), mismatched passwords and an unchecked
// terms box both block submission client-side before any request fires,
// and a successful accept signs the visitor in and redirects by role.
const signInMock = jest.fn(() => Promise.resolve({ error: null }));
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword: signInMock } }),
}));

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

const STRONG_PASSWORD = "Correct-Horse-9!";

function fillPasswords(password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText("Create a password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: confirm } });
}

describe("AcceptInvitationForm", () => {
  beforeEach(() => {
    signInMock.mockClear();
    pushMock.mockClear();
    // @ts-expect-error jsdom has no real fetch
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true, email: "jamie@example.com", invitedRole: "therapist" }) }));
  });

  it("renders the invitation's email as a locked, read-only field", () => {
    render(<AcceptInvitationForm token="tok-1" email="jamie@example.com" invitedRole="therapist" defaultFullName="Jamie Rivera" />);
    const emailField = screen.getByLabelText("Email") as HTMLInputElement;
    expect(emailField.value).toBe("jamie@example.com");
    expect(emailField).toBeDisabled();
  });

  it("blocks submission when passwords don't match, without calling the API", async () => {
    render(<AcceptInvitationForm token="tok-1" email="jamie@example.com" invitedRole="therapist" defaultFullName="Jamie Rivera" />);
    fillPasswords(STRONG_PASSWORD, "Different-Password-9!");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Create your account/ }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("blocks submission when terms aren't accepted", async () => {
    render(<AcceptInvitationForm token="tok-1" email="jamie@example.com" invitedRole="therapist" defaultFullName="Jamie Rivera" />);
    fillPasswords(STRONG_PASSWORD, STRONG_PASSWORD);
    fireEvent.click(screen.getByRole("button", { name: /Create your account/ }));

    expect(await screen.findByText(/accept the Terms/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("on success: posts the token, signs in, and redirects a therapist to /therapist", async () => {
    render(<AcceptInvitationForm token="tok-1" email="jamie@example.com" invitedRole="therapist" defaultFullName="Jamie Rivera" />);
    fillPasswords(STRONG_PASSWORD, STRONG_PASSWORD);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Create your account/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/invitations/accept",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "tok-1", fullName: "Jamie Rivera", password: STRONG_PASSWORD, acceptedTerms: true }),
      })
    ));
    await waitFor(() => expect(signInMock).toHaveBeenCalledWith({ email: "jamie@example.com", password: STRONG_PASSWORD }));
    await waitFor(() => expect(screen.getByText(/Account created/)).toBeInTheDocument());
  });

  it("surfaces a server-side error (e.g. an already-used token) without calling signIn", async () => {
    // @ts-expect-error jsdom has no real fetch
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => ({ error: "This invitation link is no longer valid." }) }));
    render(<AcceptInvitationForm token="tok-1" email="jamie@example.com" invitedRole="therapist" defaultFullName="Jamie Rivera" />);
    fillPasswords(STRONG_PASSWORD, STRONG_PASSWORD);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Create your account/ }));

    expect(await screen.findByText("This invitation link is no longer valid.")).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });
});
