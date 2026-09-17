"use client";

import ParallaxLayer from "@/components/motion/ParallaxLayer";

// Phase 241 — the Donate hero's new immersive, multi-layer parallax
// background. Reuses 2 of the same 3 photos already configured for this
// hero (heroPhoto1/3 — the video-call and clinical-team photos, same fields
// Phase 223 wired as UI Builder image fields) rather than introducing new
// images or a new CMS field. This component only renders the *background*
// — DonatePage.tsx still renders its own existing foreground photo collage
// and text column exactly as before, on top of this, at a higher z-index.
// `farSrc`/`midSrc` are passed in by the caller rather than read from
// content directly, so this component stays a plain, reusable background
// (no knowledge of `DonatePageContent`'s field names).
//
// Depth model (per Roy's brief):
//   - Far layer  (farSrc, blurred/darkened, full-bleed): slowest move + a
//     very slight scale-out as you scroll past — reads as atmosphere, not a
//     recognizable duplicate of the sharp foreground card using the same
//     photo.
//   - Mid layer  (midSrc, offset to one side, partially masked): moderate
//     move, no scale — a secondary depth plane between the far layer and the
//     content.
//   - A static, non-animated dark gradient overlay sits above both image
//     layers so the eyebrow/heading/body/CTA meet contrast requirements
//     against any part of either photo — this piece deliberately does NOT
//     move or use `will-change`, since animating a gradient/opacity here
//     would cost paint for no visual benefit ("avoid an expensive blur
//     filter animation" — the blur below is a static, one-time filter on a
//     background-attachment layer, never re-computed per frame).
//
// Mobile (below `lg`, matching every other breakpoint choice already made
// in this hero): only the far layer + overlay render — no mid layer — per
// the brief's "reduce parallax intensity substantially or use only the
// primary background layer" allowance, keeping mobile's paint/memory cost
// to one image instead of two.
//
// Entirely decorative: the whole tree is `aria-hidden`, `pointer-events-none`,
// and positioned behind the existing `relative z-10` content column, so it
// never affects tab order, text selection, or the CTA's click target.
export default function DonateHeroBackground({
  farSrc,
  midSrc,
}: {
  farSrc: string;
  midSrc: string;
}) {
  // Defensive: every existing hero photo field always resolves to a real
  // URL via DONATE_PAGE_FALLBACK, but if an admin ever clears one to blank
  // in the CMS, skip the image layers entirely rather than rendering a
  // broken-image icon — the section's own `.donate-hero-warm` gradient is
  // still a complete, on-brand background on its own.
  if (!farSrc) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Far background layer — slowest, slight scale-out, blurred +
          darkened via CSS filter (static, not re-applied per frame) so it
          reads as soft depth rather than a second sharp copy of the photo
          already visible in the foreground collage. */}
      <ParallaxLayer
        speed={9}
        scaleRange={[1.08, 1.02]}
        fadeIn
        decorative
        className="absolute inset-[-6%]"
      >
        <img
          src={farSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-70 blur-[2px] saturate-[0.9]"
        />
      </ParallaxLayer>

      {/* Mid layer — moderate movement, offset toward the right edge and
          partially faded on its left so it blends into the far layer rather
          than reading as a hard-edged rectangle. Hidden below `lg`, same
          breakpoint the existing foreground collage already uses. */}
      {midSrc && (
        <ParallaxLayer
          speed={18}
          fadeIn
          decorative
          className="absolute inset-y-0 right-0 hidden w-[55%] lg:block"
        >
          <div
            className="h-full w-full"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 35%)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 35%)",
            }}
          >
            <img
              src={midSrc}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover opacity-60 saturate-[0.9]"
            />
          </div>
        </ParallaxLayer>
      )}

      {/* Static dark gradient overlay — never animated, no will-change.
          Deepest toward the bottom-left where the text column sits, lighter
          toward the top-right where the mid layer's photo peeks through. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(13,16,23,0.86) 0%, rgba(13,16,23,0.72) 38%, rgba(13,16,23,0.42) 62%, rgba(13,16,23,0.30) 100%)",
        }}
      />
    </div>
  );
}
