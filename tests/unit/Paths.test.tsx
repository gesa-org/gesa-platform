import { render, screen } from "@testing-library/react";
import Paths from "@/components/home/Paths";

// Phase 70 removed the Home page's gold-band hero text (eyebrow/headline/
// subtitle/trust badges) and the decorative "gallery wall" of the three
// path artworks. Phase 80 restored both per Roy's request, reusing the same
// `content.*` fields that were left in the data model the whole time. This
// test now confirms the hero content and gallery are back, alongside the
// three real path cards further down.
describe("Paths (Home)", () => {
  it("renders the gold-band hero text and the decorative gallery wall", () => {
    render(<Paths />);

    expect(screen.getByText("A global volunteer support alliance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Two clicks to a therapist who understands" })).toBeInTheDocument();
    expect(
      screen.getByText(/GESA \(Global Emotional Support Alliance\) connects you with a verified volunteer therapist/)
    ).toBeInTheDocument();
    expect(screen.getByText("Verified Professionals")).toBeInTheDocument();
    expect(screen.getByText("100% Free Sessions")).toBeInTheDocument();
    expect(screen.getByText("Global Community")).toBeInTheDocument();

    // Gallery wall renders the same three artwork files decoratively
    // (aria-hidden, empty alt) alongside the cards' own non-empty-alt copies
    // further down — six total <img> renders of the three artworks combined.
    const allArtworkImgs = document.querySelectorAll('img[src*="-artwork.png"]');
    expect(allArtworkImgs.length).toBe(6);
  });

  // Phase 95 — Roy replaced the flip-card design (painting on the front,
  // description/CTA revealed on hover-flip) with framed artwork + a small
  // gold badge + serif title, and swapped the card titles to art-piece
  // names. The whole card is now one link (no separate "Reach out now"
  // button on the face) whose accessible name carries the title +
  // description — same pattern this section used before Phase 42 added
  // visible description text.
  it("still renders the three real path cards as single links to their intake path", () => {
    render(<Paths />);

    expect(screen.getByText("Grounded")).toBeInTheDocument();
    expect(screen.getByText("Service Remembrance")).toBeInTheDocument();
    expect(screen.getByText("Life from the Deep")).toBeInTheDocument();

    const groundedLink = screen.getByRole("link", { name: /^Grounded:/ });
    expect(groundedLink).toHaveAttribute("href", "/intake?path=crisis");
    expect(screen.getByRole("link", { name: /^Service Remembrance:/ })).toHaveAttribute("href", "/intake?path=veteran");
    expect(screen.getByRole("link", { name: /^Life from the Deep:/ })).toHaveAttribute("href", "/intake?path=general");
  });

  it("renders each card's artwork as decorative (empty alt) since the link's aria-label already carries the title/description", () => {
    render(<Paths />);

    // Three card images now share the same empty-alt/aria-hidden treatment
    // as the gallery wall's decorative copies (Phase 95) — combined with
    // the gallery wall, this is the same six-image total the hero test
    // above already checks; this test specifically confirms none of the
    // three card images have non-empty alt text (that would double up with
    // the link's own aria-label for screen reader users).
    expect(screen.queryAllByAltText(/artwork$/)).toHaveLength(0);
  });
});
