import { render, screen } from "@testing-library/react";
import Paths from "@/components/home/Paths";

// Phase 70 removed the Home page's gold-band hero text (eyebrow/headline/
// subtitle/trust badges) and the decorative "gallery wall" of the three
// path artworks. Phase 80 restored both per Roy's request, reusing the same
// `content.*` fields that were left in the data model the whole time.
// Phase 121 — Roy asked for the gallery wall removed again, permanently
// this time (no replacement image), and the remaining hero text centered.
// This test now confirms the hero text still renders (centered, per the
// updated markup) with no artwork left anywhere in the hero band, alongside
// the three real path cards further down (which never used these images —
// see Paths.tsx's own Phase 121 comment on `PATH_IMAGES`).
describe("Paths (Home)", () => {
  it("renders the gold-band hero text with no gallery-wall artwork", () => {
    render(<Paths />);

    expect(screen.getByText("A global volunteer support alliance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Two clicks to a therapist who understands" })).toBeInTheDocument();
    expect(
      screen.getByText(/GESA \(Global Emotional Support Alliance\) connects you with a verified volunteer therapist/)
    ).toBeInTheDocument();
    expect(screen.getByText("Verified Professionals")).toBeInTheDocument();
    expect(screen.getByText("100% Free Sessions")).toBeInTheDocument();
    expect(screen.getByText("Global Community")).toBeInTheDocument();

    // No "-artwork.png" images render anywhere in the hero band anymore —
    // the gallery wall is gone, and (per the comment above) the real path
    // cards below never used these particular files either.
    const allArtworkImgs = document.querySelectorAll('img[src*="-artwork.png"]');
    expect(allArtworkImgs.length).toBe(0);
  });

  it("still renders the three real path cards", () => {
    render(<Paths />);

    expect(screen.getByText("In crisis right now")).toBeInTheDocument();
    expect(screen.getByText("Veterans, reservists & families")).toBeInTheDocument();
    expect(screen.getByText("Seeking support")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /reach out now/i })).toHaveLength(3);
  });

  // Phase 72 — each card is now a real 3D flip: the front face shows the
  // card's own art, the back face (title/description/CTA) only becomes
  // visible on hover/focus via a CSS rotateY transform on a shared
  // group-hover wrapper. jsdom doesn't compute CSS transforms, so this
  // can't assert visual visibility directly — instead it confirms both
  // faces are actually in the DOM, and that the flip wrapper carries the
  // hover/focus rotate classes that drive the effect.
  // Phase 100 — the front face's painting (asserted here via its "artwork"
  // alt text through Phase 97/99) was replaced by the GesaMark graphic, an
  // inline SVG with no alt text of its own; this now asserts the mark
  // renders (three <svg> front faces) instead.
  it("renders both the front (GesaMark) and back (text/CTA) faces of each flip card", () => {
    render(<Paths />);

    const frontMarks = document.querySelectorAll('.gold-card-hover svg[viewBox="0 0 200 220"]');
    expect(frontMarks.length).toBe(3);

    const flipWrapper = screen.getByText("In crisis right now").closest('[class*="transform-style"]') as HTMLElement;
    // Tailwind arbitrary-property classes render literally in the DOM —
    // this just confirms the hover/focus rotate classes are present on
    // whichever element actually carries the transform.
    const rotatingEl = document.querySelector('[class*="group-hover:"][class*="rotateY"]');
    expect(rotatingEl).toBeTruthy();
    expect(flipWrapper).toBeTruthy();
  });

  // Phase 97 first restyled the front face as framed artwork + gold badge
  // dome, explicitly keeping the flip effect and the back face's own
  // title/description/CTA content untouched.
  // Phase 100 — Roy sent a new reference recoloring an abstract mark per
  // card instead of a painting, with new badge labels matching each card's
  // own category ("Crisis"/"Veterans"/"Support") rather than art-piece
  // names. This confirms the new labels render alongside the
  // still-unchanged back-face titles from the previous test.
  it("renders the new front-face badge labels without changing the back face", () => {
    render(<Paths />);

    expect(screen.getByText("Crisis")).toBeInTheDocument();
    expect(screen.getByText("Veterans")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();

    // Back face content from the earlier test is still present, unchanged.
    expect(screen.getByText("In crisis right now")).toBeInTheDocument();
    expect(screen.getByText("Veterans, reservists & families")).toBeInTheDocument();
    expect(screen.getByText("Seeking support")).toBeInTheDocument();
  });
});
