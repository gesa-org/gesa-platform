import { render, screen } from "@testing-library/react";
import Stats from "@/components/home/Stats";

// Phase 68 — Roy asked for the Stats section's background to switch from
// the pale blue-gray --card token to the same light sage green
// (--sage-soft) used on About's legal/tax-note section, for consistency
// across the two.
// Phase 80 round 2 — Stats became an async Server Component (it now fetches
// its own content via getPageContent, same pattern as DonateBand). React
// Testing Library's render() doesn't await Server Components, so the
// established workaround is to call and await the component function
// directly to get its resolved JSX before passing that into render().
describe("Stats", () => {
  it("renders the real stat values/labels and uses the shared sage-soft background", async () => {
    render(await Stats());
    expect(screen.getByText("Verified therapists")).toBeInTheDocument();
    expect(screen.getByText("Support circles")).toBeInTheDocument();

    const section = screen.getByText("Verified therapists").closest("section");
    expect(section?.className).toContain("bg-sage-soft");
    expect(section?.className).not.toContain("bg-card");
  });
});
