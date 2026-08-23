"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

// Phase 45 — cinematic scroll-linked media effect, spec section 4. Wraps
// any media element (an <img>, a next/image `fill` wrapper, etc.) and
// applies a restrained scale + vertical drift as the section scrolls
// through the viewport — deliberately small values, matching the spec's
// own example range (scale 1.05 -> 1.00) and explicit "do not use extreme
// zooming, image should remain recognizable and stable" instruction.
//
// `intensity` controls the vertical drift in pixels; `scale` controls the
// starting zoom (always animates down to 1.00, never past it, so the
// image never crops *more* than its natural state at rest).
export default function ParallaxMedia({
  children,
  intensity = 24,
  scale = 1.05,
  className,
}: {
  children: ReactNode;
  intensity?: number;
  scale?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const y = useTransform(scrollYProgress, [0, 1], [intensity, -intensity]);
  const s = useTransform(scrollYProgress, [0, 1], [scale, 1]);

  if (reducedMotion) {
    // Spec section 14 — remove parallax entirely under reduced motion,
    // render the media perfectly static.
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div style={{ y, scale: s, willChange: "transform" }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
