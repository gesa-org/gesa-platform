import { render, screen } from "@testing-library/react";
import Paths from "@/components/home/Paths";

// Phase 70 — Roy asked to remove the Home page's gold-band hero text
// (eyebrow/headline/subtitle/trust badges) and the decorative "gallery
// wall" of the three path artworks. No unit test previously covered this
// component at all; this is a minimal smoke test confirming the removed
// text/images are actually gone and the three real path cards (which carry
// the same three artwork images, just as real content further down) still
// render correctly.
describe("Paths (Home)", () => {
  it("no longer renders the gold-band hero text or the decorative gallery wall", () => {
    render(<Paths />);

    expect(screen.queryByText("A global volunteer support alliance")).not.toBeInTheDocument();
    expect(screen.queryByText("Two clicks to a therapist who understands")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/GESA \(Global Emotional Support Alliance\) connects you with a verified volunteer therapist/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Verified Professionals")).not.toBeInTheDocument();
    expect(screen.queryByText("100% Free Sessions")).not.toBeInTheDocument();
    expect(screen.queryByText("Global Community")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("still renders the three real path cards", () => {
    render(<Paths />);

    expect(screen.getByText("In crisis right now")).toBeInTheDocument();
    expect(screen.getByText("Veterans, reservists & families")).toBeInTheDocument();
    expect(screen.getByText("Seeking support")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /reach out now/i })).toHaveLength(3);
  });

  // Phase 72 — each card is now a real 3D flip: the front face shows the
  // full painting, the back face (title/description/CTA) only becomes
  // visible on hover/focus via a CSS rotateY transform on a shared
  // group-hover wrapper. jsdom doesn't compute CSS transforms, so this
  // can't assert visual visibility directly — instead it confirms both
  // faces are actually in the DOM (three artworks + three sets of text),
  // and that the flip wrapper carries the hover/focus rotate classes that
  // drive the effect.
  it("renders both the front (painting) and back (text/CTA) faces of each flip card", () => {
    render(<Paths />);

    const artworkImages = screen.getAllByAltText(/artwork$/);
    expect(artworkImages).toHaveLength(3);

    const flipWrapper = screen.getByText("In crisis right now").closest('[class*="transform-style"]') as HTMLElement;
    // Tailwind arbitrary-property classes render literally in the DOM —
    // this just confirms the hover/focus rotate classes are present on
    // whichever element actually carries the transform.
    const rotatingEl = document.querySelector('[class*="group-hover:"][class*="rotateY"]');
    expect(rotatingEl).toBeTruthy();
    expect(flipWrapper).toBeTruthy();
  });
});
