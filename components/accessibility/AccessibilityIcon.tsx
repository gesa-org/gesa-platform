// Phase 90 — an original, hand-drawn "accessible human figure" glyph (head
// circle + arms-out torso + legs), built from scratch as plain SVG
// primitives rather than traced from or copied out of any third-party
// accessibility-widget icon set. Deliberately simple/geometric so it reads
// clearly at 20-32px inside the launcher button.
//
// Phase 94 — Roy flagged the original filled-path version as looking
// cropped/too small inside the launcher (part of the figure was being cut
// off). Rebuilt as a single stroked path (rounded caps/joins) plus a head
// circle instead of a filled silhouette — every coordinate below was chosen
// with enough margin from the 0-100 viewBox edges to account for the
// stroke's own width extending past each endpoint, so nothing gets clipped
// at any of the sizes this renders at (24-32px). Proportions (a fairly high
// horizontal arm bar, short neck, long diverging legs) now match Roy's
// reference image.
export default function AccessibilityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="20" r="10" fill="currentColor" />
      <path
        d="M22 38 H78 M50 38 V45 M50 45 L35 85 M50 45 L65 85"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
