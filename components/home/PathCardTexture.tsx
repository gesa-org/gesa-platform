// Phase 191 (redone per Roy's follow-up — see Paths.tsx's own note) — the
// three path cards' front faces get a solid-color, chunky embossed block
// (no separate wood frame/cream mat like the previous design) with a faint
// background pattern specific to each card's theme — flowing lines for the
// resilience card, a branching tree for the veterans card, and an
// orbit-and-stars constellation for the support card — behind the same
// centered GesaMark. These three inline SVGs are that background texture,
// hand-drawn (not extracted from the reference image, which is a raster
// mockup with no vector source to trace) to approximate the same idea at a
// low, non-competing opacity so the centered mark stays the clear focal
// point. Rendered as a full-bleed absolute layer by the caller (see
// Paths.tsx), one instance per card, colored via `stroke`/`fill`
// "currentColor" so the caller sets the actual tone (each card uses a
// subtle tint of its own background) rather than this component
// hardcoding per-card colors.
//
// Phase 197 — Roy sent a reference image asking for this exact treatment to
// be wired into the live front face again; built, then reverted at Roy's
// request ("the result is not accurate") before shipping — this is now the
// third attempt at this redesign to be reverted (see Phase 191's own note
// above, and EXECUTION_PLAN.md). This file was left in place, unused, same
// as after Phase 191.
//
// Phase 198 — Roy sent a fourth reference along with a full written spec
// (literal hex values, an exact box-shadow, and explicit "mix-blend-mode"/
// "debossed" instructions), and this file is finally wired into Paths.tsx's
// front face for real. Each SVG below is now rendered twice per card (once
// lightened/offset up-left, once darkened/offset down-right, both blended
// via `mix-blend-mode`) to read as pressed into the card's surface rather
// than printed flat on top of it — see Paths.tsx's own Phase 198 comment.
export default function PathCardTexture({ index, className }: { index: number; className?: string }) {
  if (index === 1) {
    // Veterans — a fuller branching tree (trunk + two tiers of forking
    // limbs on each side) so the canopy reads across most of the card,
    // matching the reference's dense branch pattern rather than a single
    // thin trunk.
    return (
      <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none">
        <path
          d="M100 200 L100 96
             M100 150 L64 118 M64 118 L38 96 M64 118 L44 138 M100 150 L136 118 M136 118 L162 96 M136 118 L156 138
             M100 118 L74 84 M74 84 L52 60 M74 84 L58 100 M100 118 L126 84 M126 84 L148 60 M126 84 L142 100
             M100 96 L86 54 M86 54 L70 26 M86 54 L98 36 M100 96 L114 54 M114 54 L130 26 M114 54 L102 36
             M100 96 L100 46 M100 46 L84 18 M100 46 L116 18"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (index === 2) {
    // Support — concentric orbit rings at a few gentle tilts plus small
    // star dots scattered across the card, echoing the reference's
    // constellation texture.
    return (
      <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none">
        <ellipse cx="100" cy="100" rx="92" ry="44" stroke="currentColor" strokeWidth="1.5" transform="rotate(18 100 100)" />
        <ellipse cx="100" cy="100" rx="66" ry="66" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="100" cy="100" rx="92" ry="38" stroke="currentColor" strokeWidth="1.5" transform="rotate(-25 100 100)" />
        <ellipse cx="100" cy="100" rx="40" ry="40" stroke="currentColor" strokeWidth="1.25" transform="rotate(60 100 100)" />
        {[
          [26, 40],
          [172, 52],
          [34, 156],
          [176, 146],
          [100, 18],
          [96, 182],
          [14, 100],
          [186, 100],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" fill="currentColor" />
        ))}
      </svg>
    );
  }
  // Resilience (default, index 0) — flowing, wind/hair-like curved lines
  // sweeping across the card, echoing the reference's wave texture.
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none">
      {[8, 34, 60, 86, 112, 138, 164, 190].map((y, i) => (
        <path
          key={y}
          d={`M-10,${y} C50,${y - 26} 90,${y + 26} 150,${y - 14} C175,${y - 6} 195,${y + 10} 210,${y}`}
          stroke="currentColor"
          strokeWidth={i % 2 === 0 ? 2 : 1.4}
        />
      ))}
    </svg>
  );
}
