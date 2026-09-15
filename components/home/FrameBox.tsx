// Phase 213 — Roy sent "New Design Frames.png" again and was explicit that
// the earlier attempts (Phase 210's flat box, Phase 211's diagonal-gradient
// shading, Phase 212's flat two-tone frame) were all still missing the
// actual 3D quality in the reference: a real recessed wall niche with a
// visible top face and a visible right face, each a distinct flat plane at
// a slight angle (not a gradient, not a flat rectangle) — like a physical
// shadowbox frame viewed slightly from the front-left, light source from
// upper-left, so the top face reads about as light as the front and the
// right face and interior recess read darker, in shadow. Built as one
// precise SVG (three flat polygon faces — front trim, top, right — plus a
// blurred ground shadow) rather than CSS gradients/shadows, so the "3D
// rectangle" geometry is drawn explicitly instead of faked. The recess
// itself is also drawn here (flat `frame` fill); the GesaMark swirl is
// layered on top separately by the caller (Paths.tsx), positioned via the
// `recessRect` percentages this component exports, since GesaMark is its
// own recolorable React component, not raw SVG markup to embed inline.
export type FrameBoxColors = { front: string; top: string; side: string; recess: string };

// Percentages (of this component's own rendered box) where the recess sits,
// for the caller to position GesaMark over it precisely.
export const FRAME_BOX_RECESS_RECT = { top: "20%", left: "16%", width: "51%", height: "55%" };

export default function FrameBox({ front, top, side, recess, className }: FrameBoxColors & { className?: string }) {
  return (
    <svg viewBox="0 0 170 220" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id="frameBoxShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>
      {/* Ground shadow — blurred, offset down-right */}
      <ellipse cx="98" cy="204" rx="66" ry="12" fill="rgba(15,15,20,0.38)" filter="url(#frameBoxShadow)" />
      {/* Top face — receding up-and-right, same light as the front */}
      <polygon points="10,20 130,20 144,6 24,6" fill={top} />
      {/* Right face — receding up-and-right, in shadow */}
      <polygon points="130,20 130,190 144,176 144,6" fill={side} />
      {/* Front face (the trim band) */}
      <rect x="10" y="20" width="120" height="170" fill={front} />
      {/* Recess — the darker opening the swirl sits inside */}
      <rect x="27" y="44" width="86" height="122" fill={recess} />
      {/* Thin edge lines so the three faces read as distinct planes even at
          small sizes, where the shadow/gradient alone can flatten out. */}
      <polygon points="10,20 130,20 144,6 24,6" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      <polygon points="130,20 130,190 144,176 144,6" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1" />
      <rect x="10" y="20" width="120" height="170" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
    </svg>
  );
}
