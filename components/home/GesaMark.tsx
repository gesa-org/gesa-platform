// Phase 100 — Roy sent a reference image of a new abstract "swirl" mark
// (three nested crescents opening onto a small dot, with a short comma-like
// tail) recolored per card, and asked for it to become the new front-face
// design for the Home page's three flip-cards, replacing the framed
// painting used since Phase 97. Rather than sourcing or generating a raster
// image asset, this is coded as a real SVG component — scalable, recolored
// per-card via props from a fixed set of palette values (no new image files
// to manage), and built the same way the accessibility launcher icon was
// (Phase 90/94): plain stroked/filled path primitives approximating the
// reference art, verified visually by rendering to PNG and comparing side
// by side with the reference before landing on these exact coordinates.
//
// The three arcs are literally the same circle at three radii (72/54/37),
// each swept through the same 285°-degree span with a shared gap centered
// at 15° (upper right) — only stroke width and color change per ring. The
// "tail" is a small filled comma shape closing the innermost ring's lower
// end into the dot, and the dot itself is a plain filled circle. All four
// colors are passed in per card (outerRing/middleRing/innerRing/dot) so the
// same markup can be recolored to match each card's mat, rather than three
// near-duplicate components.
export type GesaMarkColors = {
  outerRing: string;
  middleRing: string;
  innerRing: string;
  dot: string;
};

export default function GesaMark({ colors, className }: { colors: GesaMarkColors; className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden="true">
      <path
        d="M 143.8 152.1 A 72 72 0 1 1 166.5 67.4"
        stroke={colors.outerRing}
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 132.9 137.8 A 54 54 0 1 1 149.9 74.3"
        stroke={colors.middleRing}
        strokeWidth="17"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 122.5 124.4 A 37 37 0 1 1 134.2 80.8"
        stroke={colors.innerRing}
        strokeWidth="15"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 128 118 C 138 128, 132 145, 112 148 C 122 140, 122 128, 112 122 Z" fill={colors.innerRing} />
      <circle cx="150" cy="107" r="11" fill={colors.dot} />
    </svg>
  );
}
