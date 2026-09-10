import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "@/app/signup/page";

// Phase 175 — no signup test previously existed. Covers the two new
// requirements from Roy's spec: a required Confirm Password field that
// must match before an account is created, and the shared password-
// strength policy (lib/auth/passwordPolicy.ts) applied here the same way
// as Reset Password.
const COMPLIANT_PASSWORD = "NewPassw0rd!23";

const mockSignUp = jest.fn(async () => ({ error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: (...args: unknown[]) => mockSignUp(...args) },
  }),
}));

// The submit handler also fires a fire-and-forget welcome email request;
// stub `fetch` so it doesn't hit a real network call in tests.
beforeEach(() => {
  mockSignUp.mockClear();
  global.fetch = jest.fn(() => Promise.resolve({} as Response));
});

function fillCommonFields() {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Jamie Rivera" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jamie@example.com" } });
}

describe("SignupPage", () => {
  it("blocks submission when Password and Confirm password don't match, without calling Supabase", async () => {
    render(<SignupPage />);
    fillCommonFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "SomethingElse1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("blocks submission when the password doesn't meet the strength policy, without calling Supabase", async () => {
    render(<SignupPage />);
    fillCommonFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "lowercase12345" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "lowercase12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Choose a stronger password that meets the requirements below.")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("creates the account and shows the confirmation state when everything is valid", async () => {
    render(<SignupPage />);
    fillCommonFields();

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: COMPLIANT_PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "jamie@example.com",
          password: COMPLIANT_PASSWORD,
        })
      )
    );
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });

  it("toggles Password and Confirm password visibility independently", () => {
    render(<SignupPage />);

    const password = screen.getByLabelText("Password");
    const confirm = screen.getByLabelText("Confirm password");
    const [showPassword] = screen.getAllByRole("button", { name: "Show password" });

    fireEvent.click(showPassword);
    expect(password).toHaveAttribute("type", "text");
    expect(confirm).toHaveAttribute("type", "password");
  });
});
