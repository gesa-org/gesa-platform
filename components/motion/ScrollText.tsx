"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

// Phase 45 — scroll-linked text movement for selected major statements
// only, spec section 5. The spec is explicit this should be used
// sparingly ("only on selected high-level content... do not apply it to
// every paragraph"), so this is intentionally not wired into body copy or
// card text anywhere — only into the one or two largest headline moments
// per page that call it directly.
//
// Behavior: as the section scrolls through the viewport, the text drifts
// a small amount upward, settles at its natural position through the
// middle of the scroll range, then the effect reverses on exit — matching
// the spec's enter -> stable -> exit diagram.
export default function ScrollText({
  children,
  distance = 28,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const y = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [distance, 0, 0, -distance]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
