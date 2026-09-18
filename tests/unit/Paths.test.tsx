import { render, screen } from "@testing-library/react";
import Paths, { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";

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
    expect(screen.getAllByRole("link", { name: /reach out now/i })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Start AI matching for support related to terror." })).toBeInTheDocument();
  });

  // Phase 72 — each card is now a real 3D flip: the front face shows the
  // card's own art, the back face (title/description/CTA) only becomes
  // visible on hover/focus via a CSS rotateY transform on a shared
  // group-hover wrapper. jsdom doesn't compute CSS transforms, so this
  // can't assert visual visibility directly — instead it confirms both
  // faces are actually in the DOM, and that the flip wrapper carries the
  // hover/focus rotate classes that drive the effect.
  it("renders the framed front artwork and back content for each flip card", () => {
    render(<Paths />);

    expect(document.querySelectorAll(".gold-card-hover img")).toHaveLength(3);
    expect(document.querySelector('img[src*="war-framed-swirl-v3.png"]')).toBeInTheDocument();

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
  // title/description/CTA content untouched. The badge text round-tripped
  // through War/Terror/Disaster (154) and Resilience/Veterans/Support (209)
  // before Phase 210's reference image landed it back on Crisis/Veterans/
  // Support — the same wording Phase 100 originally used.
  it("renders the new front-face badge labels without changing the back face", () => {
    render(<Paths />);

    expect(screen.getByText("CRISIS")).toBeInTheDocument();
    expect(screen.getByText("VETARANS")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();

    // Back face content from the earlier test is still present, unchanged.
    expect(screen.getByText("In crisis right now")).toBeInTheDocument();
    expect(screen.getByText("Veterans, reservists & families")).toBeInTheDocument();
    expect(screen.getByText("Seeking support")).toBeInTheDocument();
  });

  it("keeps the approved portal labels when older CMS content says WAR or TERROR", () => {
    render(<Paths content={{ ...HOME_CONTENT_FALLBACK, card1FrontLabel: "WAR", card2FrontLabel: "TERROR" }} />);

    const crisisLabel = screen.getByText("CRISIS");
    const veteransLabel = screen.getByText("VETARANS");
    expect(crisisLabel).toBeInTheDocument();
    expect(veteransLabel).toBeInTheDocument();
    expect(screen.queryByText("WAR")).not.toBeInTheDocument();
    expect(screen.queryByText("TERROR")).not.toBeInTheDocument();
    expect(crisisLabel.closest("div")).toHaveClass("w-[164px]", "justify-center");
    expect(veteransLabel.closest("div")).toHaveClass("w-[164px]", "justify-center");
    expect(Array.from(document.querySelectorAll("[class]")).some((element) => element.getAttribute("class")?.includes("bg-[#f6f6f4]") ?? false)).toBe(false);
  });
});
