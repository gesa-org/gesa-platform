import { render, screen } from "@testing-library/react";
import { ShieldCheck } from "lucide-react";
import PageHero from "@/components/ui/PageHero";

// Phase 67 — Roy asked for the same faint line-art watermark texture
// already on About's gold Hero band to appear on every other
// gold-background section site-wide, starting with Our Therapists and
// Support Groups — both of which render their header through this one
// shared PageHero component with `gold` passed. This confirms the
// watermark only shows up when `gold` is actually on, so FAQ/Contact/legal
// pages (which render PageHero without it) stay visually unchanged.
describe("PageHero — gold watermark texture", () => {
  it("does not render the gold watermark icons when gold is false (default)", () => {
    const { container } = render(<PageHero icon={ShieldCheck} eyebrow="Our Therapists" title="Meet our team" />);
    // GoldWatermarks renders lucide <svg> icons with no distinguishing
    // text, so checking for their absence via a class none of this
    // component's own non-gold markup uses. Note: lucide-react's `Globe2`
    // is actually an alias re-exporting its `Earth` icon under the hood
    // (node_modules/lucide-react/dist/esm/icons/globe-2.js), so the real
    // rendered class is "lucide-earth", not "lucide-globe2" — confirmed by
    // reading lucide-react's own source rather than guessing.
    expect(container.querySelectorAll("svg.lucide-earth")).toHaveLength(0);
  });

  it("renders the gold watermark icons when gold is true", () => {
    const { container } = render(
      <PageHero icon={ShieldCheck} eyebrow="Our Therapists" title="Meet our team" gold />
    );
    expect(container.querySelectorAll("svg.lucide-earth").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("svg.lucide-link2").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("svg.lucide-heart-handshake").length).toBeGreaterThanOrEqual(1);
    expect(container.querySelectorAll("svg.lucide-sparkles").length).toBeGreaterThanOrEqual(1);
    expect(container.querySelectorAll("svg.lucide-users").length).toBeGreaterThanOrEqual(1);
  });

  it("still renders the real heading/eyebrow copy unchanged either way", () => {
    render(<PageHero icon={ShieldCheck} eyebrow="Support Groups" title="Find your circle" gold />);
    expect(screen.getByText("Support Groups")).toBeInTheDocument();
    expect(screen.getByText("Find your circle")).toBeInTheDocument();
  });
});
