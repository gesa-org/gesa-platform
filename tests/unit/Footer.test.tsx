import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";

// Phase 57 — Roy reported the Phase 56 footer redesign visually broke the
// live footer, which wasn't caught before shipping since verification only
// ever ran a type-check, not an actual render. This is a minimal smoke test
// (renders with the real default fallback content, no props) asserting the
// footer's key pieces — the four nav columns, the Phase 57 social/partners
// row, and the bottom bar — all actually render without throwing. It won't
// catch every possible visual regression, but it would have caught a crash
// or a missing section outright.
describe("Footer", () => {
  it("renders all four nav columns, the social/partners row, and the bottom bar", () => {
    render(<Footer />);

    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();

    expect(screen.getByText("Connect with Us")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GESA on LinkedIn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GESA on Twitter" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GESA on Instagram" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GESA on Facebook" })).toBeInTheDocument();

    expect(screen.getByText("Our Trusted Partners")).toBeInTheDocument();
    expect(screen.getByText("Global Mental Health Alliance")).toBeInTheDocument();
    expect(screen.getByText("Validated Therapist Network")).toBeInTheDocument();
    expect(screen.getByText("Crisis Support International")).toBeInTheDocument();

    expect(screen.getByText("GESA is a registered 501(c)(3) non-profit in the United States.")).toBeInTheDocument();
    expect(screen.getByText(/A registered non-profit organization\./)).toBeInTheDocument();
  });

  // Phase 214 — Roy asked for account access to move out of the public
  // header (AuthStatus.test.tsx covers that side) and into the footer's
  // Explore column instead, right after Donate, linking to the new tabbed
  // /account-access screen.
  it("renders a 'Sign In / Create Account' link in Explore, after Donate", () => {
    render(<Footer />);

    const signInLink = screen.getByRole("link", { name: "Sign In / Create Account" });
    expect(signInLink).toHaveAttribute("href", "/account-access");

    const exploreList = signInLink.closest("ul") as HTMLElement;
    const linkTexts = Array.from(exploreList.querySelectorAll("a")).map((a) => a.textContent?.trim());
    const donateIndex = linkTexts.findIndex((t) => t?.includes("DONATE"));
    const signInIndex = linkTexts.indexOf("Sign In / Create Account");
    expect(donateIndex).toBeGreaterThanOrEqual(0);
    expect(signInIndex).toBe(donateIndex + 1);
  });

  // Phase 70 — the footer grew a 5th column embedding the new "Help us
  // grow" form; this just checks it's actually present alongside the
  // existing four nav columns, not that the form itself works end-to-end
  // (that's covered by HelpUsGrowForm.test.tsx).
  it("renders the Help us grow form alongside the existing nav columns", () => {
    render(<Footer />);

    expect(screen.getByText("Help us grow")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });
});
