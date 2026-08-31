import { render, screen } from "@testing-library/react";
import DonatePage from "@/components/donate/DonatePage";

// Phase 98 — DonatePage is an async Server Component (fetches its own
// content via getPageContent, same pattern as Stats/DonateBand), so the
// established workaround (see Stats.test.tsx) is to await the component
// function directly before passing its resolved JSX into render().
describe("DonatePage", () => {
  it("renders the hero, giving box, impact row, movement band, trust badges, and crisis line", async () => {
    render(await DonatePage());

    expect(screen.getByRole("heading", { level: 1, name: "You can help meaningful support reach someone." })).toBeInTheDocument();
    expect(screen.getByText("Their time is the gift. Your support helps it reach further.")).toBeInTheDocument();
    expect(screen.getByText("Make support possible")).toBeInTheDocument();

    // Giving box (DonateForm) renders inside the page.
    expect(screen.getByText("Choose how you would like to contribute")).toBeInTheDocument();
    expect(screen.getByText("Make my gift")).toBeInTheDocument();

    // Impact row.
    expect(screen.getByText("What your gift helps make possible")).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
    expect(screen.getByText("Connection")).toBeInTheDocument();
    expect(screen.getByText("Continuity")).toBeInTheDocument();

    // Movement band.
    expect(screen.getByText("One choice can carry support across the world.")).toBeInTheDocument();
    expect(screen.getByText("Be part of the movement")).toBeInTheDocument();

    // Trust badges.
    expect(screen.getByText("Clear Impact")).toBeInTheDocument();
    expect(screen.getByText("Secure Contribution")).toBeInTheDocument();
    expect(screen.getByText("Global Reach")).toBeInTheDocument();

    // Crisis line — a real, functioning external link, not a dead one.
    const crisisLink = screen.getByText("Find local crisis services.");
    expect(crisisLink).toHaveAttribute("href", "https://findahelpline.com/");
    expect(crisisLink).toHaveAttribute("target", "_blank");
  });

  it("the hero CTA scrolls down to the giving box instead of linking away", async () => {
    render(await DonatePage());
    expect(screen.getByText("Make support possible")).toHaveAttribute("href", "#giving-box");
    expect(document.getElementById("giving-box")).toBeInTheDocument();
  });
});
