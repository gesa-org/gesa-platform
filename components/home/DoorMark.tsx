// Phase 209 — Roy sent a reference image restyling each Home pathway card's
// front face as an ajar wooden doorway (wall-mounted frame, a single
// raised-panel door leaf swung open toward the viewer with a small handle),
// replacing the Phase 100-124 "framed abstract GesaMark" treatment. This is
// a flat, vector-style illustration in the reference (not a photo), so it's
// rendered as one SVG per card — the same "code an SVG rather than source a
// photo" approach GesaMark itself already used for the mark it replaces.
// `door`/`frame` are the two colors that vary per card (see
// PATH_FRONT_STYLES in Paths.tsx); everything else (panel inset, handle,
// doorway shadow, floor shadow) is fixed artwork shared by all three doors.
export type DoorMarkColors = { door: string; frame: string };

export default function DoorMark({ door, frame, className }: DoorMarkColors & { className?: string }) {
  return (
    <svg viewBox="0 0 100 150" className={className} aria-hidden="true" focusable="false">
      {/* Wall opening / door frame */}
      <rect x="6" y="4" width="88" height="142" rx="4" fill={frame} />
      {/* Dark gap behind the open door — suggests depth into the doorway */}
      <polygon points="14,10 14,140 25,136 25,14" fill="rgba(12,14,20,0.55)" />
      {/* Door leaf, swung open toward the viewer (trapezoid = perspective) */}
      <polygon points="25,10 78,20 72,132 25,140" fill={door} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      {/* Raised center panel inset */}
      <polygon points="35,27 68,33 64,119 35,125" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
      {/* Door handle */}
      <ellipse cx="65" cy="79" rx="3" ry="5" fill="#f6ead0" stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
      {/* Floor contact shadow */}
      <ellipse cx="50" cy="147" rx="34" ry="4" fill="rgba(12,14,20,0.18)" />
    </svg>
  );
}
