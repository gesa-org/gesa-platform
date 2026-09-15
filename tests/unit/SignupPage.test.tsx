import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "@/app/signup/page";

// Phase 214 — rebuilt around the shared CreateAccountForm (first/last name,
// DOB + country, T&C/Privacy consent, and the under-18 guardian-consent
// branch). Replaces the older Phase 175 test file, which asserted a single
// "Full name" field and click-then-error validation that no longer match
// this form's behavior (the submit button is now disabled until every
// required field is valid, rather than allowing a bad submit to surface an
// error after the fact).
const COMPLIANT_PASSWORD = "NewPassw0rd!23";

const mockSignUp = jest.fn(async () => ({ data: { user: { id: "new-user-1" } }, error: null }));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: (...args: unknown[]) => mockSignUp(...args) },
  }),
}));

beforeEach(() => {
  mockSignUp.mockClear();
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true }) } as Response));
});

function isoDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function fillCommonFields(dobYearsAgo: number) {
  fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Jamie" } });
  fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Rivera" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jamie@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: COMPLIANT_PASSWORD } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: COMPLIANT_PASSWORD } });
  fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: isoDateYearsAgo(dobYearsAgo) } });
}

function submitButton() {
  return screen.getByRole("button", { name: "Create account" });
}

describe("SignupPage — adult registration", () => {
  it("keeps Create account disabled until every required field (including the consent checkbox) is valid", () => {
    render(<SignupPage />);
    expect(submitButton()).toBeDisabled();

    fillCommonFields(30);
    expect(submitButton()).toBeDisabled(); // consent checkbox still unchecked

    fireEvent.click(screen.getByText(/I have read and agree to the GESA/));
    expect(submitButton()).toBeEnabled();
  });

  it("shows an inline error when Password and Confirm password don't match, and keeps the button disabled", () => {
    render(<SignupPage />);
    fillCommonFields(30);
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "SomethingElse1!" } });
    fireEvent.blur(screen.getByLabelText("Confirm password"));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("creates an active account (18+) and shows the email-confirmation state", async () => {
    render(<SignupPage />);
    fillCommonFields(30);
    fireEvent.click(screen.getByText(/I have read and agree to the GESA/));
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "jamie@example.com",
          password: COMPLIANT_PASSWORD,
          options: expect.objectContaining({
            data: expect.objectContaining({
              full_name: "Jamie Rivera",
              account_status: "active",
            }),
          }),
        })
      )
    );
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    // No guardian-consent request should ever be sent for an adult.
    expect(global.fetch).not.toHaveBeenCalledWith("/api/auth/guardian-consent", expect.anything());
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

  it("Terms & Conditions and Privacy Policy are real links to the legal pages", () => {
    render(<SignupPage />);
    expect(screen.getByRole("link", { name: "Terms & Conditions" })).toHaveAttribute("href", "/terms-and-conditions");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy-policy");
  });
});

// Phase 214 — under-18 safeguarding. A date of birth under 18 must reveal
// the guardian section and block submission until the minor's own
// "guardian knows" checkbox plus every guardian field is filled in; on
// submit, the account is created pending guardian consent (never
// immediately active) and a guardian-consent request is sent.
describe("SignupPage — under-18 registration", () => {
  it("reveals the guardian section only once the date of birth is under 18", () => {
    render(<SignupPage />);
    expect(screen.queryByLabelText("Guardian full name")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: isoDateYearsAgo(16) } });
    expect(screen.getByLabelText("Guardian full name")).toBeInTheDocument();
    expect(screen.getByText(/I confirm that my parent or legal guardian knows/)).toBeInTheDocument();
  });

  it("keeps Create account disabled for a minor until the guardian fields and both checkboxes are filled in", () => {
    render(<SignupPage />);
    fillCommonFields(16);
    fireEvent.click(screen.getByText(/I have read and agree to the GESA/));
    expect(submitButton()).toBeDisabled(); // guardian section still empty

    fireEvent.click(screen.getByText(/I confirm that my parent or legal guardian knows/));
    fireEvent.change(screen.getByLabelText("Guardian full name"), { target: { value: "Pat Rivera" } });
    fireEvent.change(screen.getByLabelText("Guardian email address"), { target: { value: "pat@example.com" } });
    fireEvent.change(screen.getByLabelText("Guardian's relationship to you"), { target: { value: "Parent" } });

    expect(submitButton()).toBeEnabled();
  });

  it("creates a pending account, sends the guardian-consent request, and shows the waiting state", async () => {
    render(<SignupPage />);
    fillCommonFields(15);
    fireEvent.click(screen.getByText(/I have read and agree to the GESA/));
    fireEvent.click(screen.getByText(/I confirm that my parent or legal guardian knows/));
    fireEvent.change(screen.getByLabelText("Guardian full name"), { target: { value: "Pat Rivera" } });
    fireEvent.change(screen.getByLabelText("Guardian email address"), { target: { value: "pat@example.com" } });
    fireEvent.change(screen.getByLabelText("Guardian's relationship to you"), { target: { value: "Parent" } });
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: expect.objectContaining({ account_status: "pending_guardian_consent" }),
          }),
        })
      )
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/guardian-consent",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("pat@example.com"),
        })
      )
    );

    expect(await screen.findByText("Almost there")).toBeInTheDocument();
  });
});
