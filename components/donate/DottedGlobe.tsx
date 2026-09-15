// Phase 223 — Roy's "BG Donate Page.jpg" reference mockup shows a faint
// dotted/network-line globe graphic bleeding off the right edge of the
// Donate hero. No such asset exists anywhere in this codebase (checked
// public/images and every decorative SVG — see EXECUTION_PLAN.md Phase 223),
// so this is a small original wireframe-globe drawn from dashed
// latitude/longitude arcs plus a handful of "node" dots and connecting
// lines, in the same restrained line-art spirit as GoldWatermarks.tsx.
// Purely decorative: renders bare (no wrapper), meant to sit inside an
// absolutely-positioned `pointer-events-none overflow-hidden` layer, colored
// via `currentColor` so a parent `text-*` class controls its tint/opacity.
export default function DottedGlobe({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 8" />
      <ellipse cx="200" cy="200" rx="70" ry="180" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 7" />
      <ellipse cx="200" cy="200" rx="140" ry="180" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 7" />
      <ellipse cx="200" cy="200" rx="180" ry="70" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 7" />
      <ellipse cx="200" cy="200" rx="180" ry="140" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 7" />
      {/* network nodes + connecting lines, scattered like the mockup's glowing dots */}
      <line x1="80" y1="120" x2="190" y2="70" stroke="currentColor" strokeWidth="1" strokeDasharray="1 6" />
      <line x1="190" y1="70" x2="310" y2="130" stroke="currentColor" strokeWidth="1" strokeDasharray="1 6" />
      <line x1="60" y1="230" x2="180" y2="330" stroke="currentColor" strokeWidth="1" strokeDasharray="1 6" />
      <line x1="180" y1="330" x2="320" y2="270" stroke="currentColor" strokeWidth="1" strokeDasharray="1 6" />
      <line x1="310" y1="130" x2="320" y2="270" stroke="currentColor" strokeWidth="1" strokeDasharray="1 6" />
      <circle cx="80" cy="120" r="3.5" fill="currentColor" />
      <circle cx="190" cy="70" r="4.5" fill="currentColor" />
      <circle cx="310" cy="130" r="3.5" fill="currentColor" />
      <circle cx="60" cy="230" r="3.5" fill="currentColor" />
      <circle cx="180" cy="330" r="4.5" fill="currentColor" />
      <circle cx="320" cy="270" r="3.5" fill="currentColor" />
      <circle cx="200" cy="200" r="2.5" fill="currentColor" />
    </svg>
  );
}
