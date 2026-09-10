import { render, screen, fireEvent } from "@testing-library/react";
import PasswordInput from "@/components/ui/PasswordInput";

// Phase 175 — the shared show/hide password field used across Sign In,
// Sign Up, Reset Password, and Change Password. Covers the exact behaviors
// called out in the spec: starts masked, toggles independently per
// instance, never clears/changes the typed value, and is a real
// type="button" so it can never submit a surrounding form.
describe("PasswordInput", () => {
  it("starts masked and reveals/hides the value on toggle, without changing it", () => {
    render(<PasswordInput label="Password" name="password" defaultValue="hunter2" />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("hunter2");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("hunter2");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("hunter2");
  });

  it("uses a type=button toggle so it can't submit a surrounding form", () => {
    render(<PasswordInput label="Password" name="password" />);
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute("type", "button");
  });

  it("toggles two instances on the same form completely independently", () => {
    render(
      <>
        <PasswordInput label="Password" name="password" defaultValue="a" />
        <PasswordInput label="Confirm Password" name="confirm_password" defaultValue="b" />
      </>
    );

    const password = screen.getByLabelText("Password");
    const confirm = screen.getByLabelText("Confirm Password");
    const [showPassword, showConfirm] = screen.getAllByRole("button", { name: "Show password" });

    fireEvent.click(showPassword);
    expect(password).toHaveAttribute("type", "text");
    expect(confirm).toHaveAttribute("type", "password");

    fireEvent.click(showConfirm);
    expect(confirm).toHaveAttribute("type", "text");
  });

  it("skips rendering its own <label> when `label` is omitted, for pages that render one externally", () => {
    render(
      <div>
        <label htmlFor="external-password">Password</label>
        <PasswordInput id="external-password" name="password" />
      </div>
    );
    // Exactly one label should be associated with the input.
    expect(screen.getAllByText("Password")).toHaveLength(1);
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });
});
