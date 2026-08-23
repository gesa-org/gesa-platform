// Phase 45 — shared timing/easing/distance constants for the site-wide
// scroll-driven motion layer (see EXECUTION_PLAN.md Phase 45 for the full
// writeup). Every motion primitive in this folder reads from here instead
// of hardcoding its own numbers, per the source spec's "Animation
// Configuration" section — one place to retune the whole site's motion
// feel instead of hunting through every component.
//
// Numbers below are taken directly from the spec's "Animation Timing"
// section: micro interactions 150-250ms, standard reveals 400-700ms, large
// visual transitions 600-1000ms, stagger offsets 80-150ms. Picked the
// midpoint of each range as the default.
// Phase 46 — nudged reveal/large durations and stagger up slightly (still
// inside the spec's own stated ranges) and distances below up too. Roy's
// feedback on Phase 45 was that the motion read as too subtle/"static" to
// notice at a glance; these are the numbers that actually control how
// perceptible every primitive in this folder is, so this one change
// affects the whole site's motion feel without touching any component.
export const MOTION_DURATION = {
  micro: 0.2,
  reveal: 0.65,
  large: 0.9,
  stagger: 0.12,
} as const;

// A calm, no-overshoot ease (approximates easeOutExpo) — deliberately not
// using any spring/bounce/elastic curve, per the spec's explicit "avoid
// bouncing, excessive elastic effects" guidance.
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

// Default entrance offsets or a "fade + upward movement" reveal, kept
// small per the spec's "refinement rather than spectacle" note.
export const MOTION_DISTANCE = {
  sm: 28,
  md: 52,
  lg: 72,
} as const;

export const MOTION_SCALE_SUBTLE = 0.97;

// Reveal viewport trigger: fires a little before the element is fully in
// view, only once, so re-scrolling past a section doesn't replay it.
export const REVEAL_VIEWPORT = { once: true, margin: "-10% 0px -10% 0px" } as const;

// Tablet/mobile get shorter distances and tighter stagger per the spec's
// "Responsive Behavior" section — components that accept a `respondToSize`
// flag can scale these down; kept as simple multipliers rather than a
// second full config object.
export const MOTION_RESPONSIVE_SCALE = {
  desktop: 1,
  tablet: 0.6,
  mobile: 0.35,
} as const;
