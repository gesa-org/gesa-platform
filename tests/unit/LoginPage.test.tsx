import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// Phase 78 — Roy flagged that the login card had no way for a user who
// forgot their password to get back in. This confirms the new "Forgot
// password?" link is actually present and points at the new
// /forgot-password page.
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn(async () => ({ error: null }));
let mockAccountStatus: string | null = "active";

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: mockAccountStatus ? { account_status: mockAccountStatus } : null }),
        }),
      }),
    }),
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockRefresh.mockClear();
  mockSignOut.mockClear();
  mockAccountStatus = "active";
});

describe("LoginPage", () => {
  it("shows a Forgot password? link pointing at /forgot-password", () => {
    render(<LoginPage />);

    const link = screen.getByRole("link", { name: "Forgot password?" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/forgot-password");
  });

  it("signs a normal (active) account in and redirects", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "adult@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "whatever" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // Phase 214 — Roy's under-18 safeguarding spec: "Do not allow the minor
  // to sign in ... until guardian consent has been confirmed." Supabase
  // Auth itself has no concept of this, so the block happens one beat after
  // a successful sign-in: SignInForm reads the fresh session's own profile
  // and, if account_status isn't "active", immediately signs the session
  // back out and shows the guardian-pending notice instead of redirecting.
  it("blocks sign-in and signs the session back out when the account is pending guardian consent", async () => {
    mockAccountStatus = "pending_guardian_consent";
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: "minor-1" } }, error: null });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "minor@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "whatever" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("This account is waiting on parent/guardian consent.")).toBeInTheDocument();
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
