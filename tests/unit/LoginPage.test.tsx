import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// Phase 78 — Roy flagged that the login card had no way for a user who
// forgot their password to get back in. This confirms the new "Forgot
// password?" link is actually present and points at the new
// /forgot-password page.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword: jest.fn() },
  }),
}));

describe("LoginPage", () => {
  it("shows a Forgot password? link pointing at /forgot-password", () => {
    render(<LoginPage />);

    const link = screen.getByRole("link", { name: "Forgot password?" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/forgot-password");
  });
});
