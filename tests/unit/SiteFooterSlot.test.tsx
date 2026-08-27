import { render, screen } from "@testing-library/react";
import SiteFooterSlot from "@/components/SiteFooterSlot";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from "next/navigation";

// Phase 75 — Roy asked for the "Your gift keeps care free" donate band to
// stop being part of the footer-reveal effect (it used to sit inside the
// fixed layer alongside the Footer, hidden until the visitor scrolled past
// the page). DonateBand moved out into each reveal-enabled page's own
// normal content instead — SiteFooterSlot's fixed layer should now contain
// only the Footer.
describe("SiteFooterSlot", () => {
  it("does not render the donate band on a reveal-enabled route (Home)", () => {
    (usePathname as jest.Mock).mockReturnValue("/");
    render(<SiteFooterSlot />);

    expect(screen.queryByText("Your gift keeps care free")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Donate to GESA" })).not.toBeInTheDocument();
    // The Footer itself should still be there, inside the reveal layer.
    expect(screen.getByText("Explore")).toBeInTheDocument();
  });

  it("does not render the donate band on a non-reveal route either", () => {
    (usePathname as jest.Mock).mockReturnValue("/contact");
    render(<SiteFooterSlot />);

    expect(screen.queryByText("Your gift keeps care free")).not.toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
  });
});
