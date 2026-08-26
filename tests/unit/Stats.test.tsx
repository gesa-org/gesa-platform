import { render, screen } from "@testing-library/react";
import Stats from "@/components/home/Stats";

// Phase 68 — Roy asked for the Stats section's background to switch from
// the pale blue-gray --card token to the same light sage green
// (--sage-soft) used on About's legal/tax-note section, for consistency
// across the two.
describe("Stats", () => {
  it("renders the real stat values/labels and uses the shared sage-soft background", () => {
    render(<Stats />);
    expect(screen.getByText("Verified therapists")).toBeInTheDocument();
    expect(screen.getByText("Support circles")).toBeInTheDocument();

    const section = screen.getByText("Verified therapists").closest("section");
    expect(section?.className).toContain("bg-sage-soft");
    expect(section?.className).not.toContain("bg-card");
  });
});
