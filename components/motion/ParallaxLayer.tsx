"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

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
export default function ParallaxLayer({
  children,
  speed = 40,
  className,
}: {
  children: ReactNode;
  /** Max drift in pixels across the element's full scroll-through range. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed]);

  if (reducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ y, willChange: "transform" }} className={className}>
      {children}
    </motion.div>
  );
}
