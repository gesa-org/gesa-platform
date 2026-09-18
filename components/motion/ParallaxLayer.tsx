"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { scaleParallaxScale, scaleParallaxTravel } from "@/components/motion/config";
import { useMobileParallaxFactor } from "@/components/motion/useMobileParallaxFactor";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";

// Phase 46 — background-layer parallax for the decorative glow/blob
// elements that already sit behind section content (Home's Paths,
// About's Hero, PageHero's shared banner). Spec section 10 ("Section
// Transition System") asks for exactly this: a background layer with
// subtle parallax, separate from the content layer's own reveal — this is
// the "Background layer -> subtle parallax" half of that diagram.
// ParallaxMedia.tsx (Phase 45) is deliberately not reused here — it's
// built around a real media element inside an `overflow-hidden` frame,
// whereas these decorative blobs are already absolutely-positioned inside
// a section and just need a plain vertical drift with no clipping frame
// of their own.
//
// Phase 241 — extended (backward-compatibly) for the Donate hero's new
// multi-layer parallax background (DonateHeroBackground.tsx):
//   - `scaleRange` is a new, optional prop layering a subtle scroll-linked
//     scale on top of the existing vertical drift — every existing caller
//     (Home's Paths.tsx, About's Hero.tsx, PageHero.tsx) omits it, so
//     `useTransform(..., scaleRange ?? [1, 1])` is a permanent no-op scale
//     of 1 for them; nothing about their existing drift-only behavior
//     changes.
//   - `decorative` is a new, optional prop that marks a layer as pure
//     background art (`aria-hidden`) — again omitted by every existing
//     caller, so it defaults to `undefined`/no attribute, identical to
//     before this phase.
//   - `fadeIn` is a new, optional prop enabling a one-time opacity/scale
//     entrance on mount (via framer-motion's own `initial`/`animate`,
//     already the same mechanism `Reveal.tsx` uses elsewhere in this
//     folder) — also opt-in, so every existing caller's first paint is
//     unaffected.
// The reduced-motion branch below is unchanged in spirit: still a plain,
// unanimated `<div>` with no `style`/`motion` wrapper at all — this project
// standardized on `useSafeReducedMotion()` specifically to avoid the
// hydration mismatch documented in that hook's own comment (Phase 176), so
// this component (like Reveal/StaggerGroup) keeps using it rather than a
// raw `window.matchMedia` check done independently.
export default function ParallaxLayer({
  children,
  speed = 40,
  scaleRange,
  fadeIn = false,
  decorative,
  className,
}: {
  children: ReactNode;
  /** Max drift in pixels across the element's full scroll-through range. */
  speed?: number;
  /** New, Phase 241 — optional [start, end] scale applied across the same
   * scroll-through range, e.g. [1.08, 1.02] for a far background layer that
   * very slightly settles as it scrolls past. Omitted = no scale effect. */
  scaleRange?: [number, number];
  /** New, Phase 241 — soft opacity/scale entrance animation on mount, then
   * the layer remains scroll-reactive as normal. */
  fadeIn?: boolean;
  /** New, Phase 241 — marks this layer as pure decorative background art
   * (not real content), hiding it from the accessibility tree. */
  decorative?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useSafeReducedMotion();
  const mobileFactor = useMobileParallaxFactor();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const adjustedSpeed = scaleParallaxTravel(speed, mobileFactor);
  const adjustedScaleRange: [number, number] = scaleRange
    ? [scaleParallaxScale(scaleRange[0], mobileFactor), scaleParallaxScale(scaleRange[1], mobileFactor)]
    : [1, 1];
  const y = useTransform(scrollYProgress, [0, 1], [-adjustedSpeed, adjustedSpeed]);
  const scale = useTransform(scrollYProgress, [0, 1], adjustedScaleRange);

  if (reducedMotion) {
    return (
      <div ref={ref} className={className} aria-hidden={decorative || undefined}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{ y, scale, willChange: "transform" }}
      className={className}
      aria-hidden={decorative || undefined}
      {...(fadeIn
        ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.7, ease: "easeOut" },
          }
        : null)}
    >
      {children}
    </motion.div>
  );
}
