"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Fragment, useRef } from "react";
import { useViewportScale } from "@/components/motion/useViewportScale";

// Phase 45 — horizontal scroll-linked statement, spec section 6. Renders
// a row of short concepts/words (content supplied by the caller — must be
// real, existing GESA copy, never hardcoded here) that drifts sideways as
// the row scrolls through the viewport, clipped to its own container so
// it never causes page-level horizontal overflow.
//
// Deliberately NOT a tall pinned/"scrub" section that hijacks several
// screens of vertical scroll for one decorative row — the spec's own
// diagram is a single-viewport-height row, and the "visual restraint"
// section (17) argues against spending that much attention on a
// secondary element. The track just translates within a normal-height
// row based on that row's own enter/exit progress, the same mechanism
// ScrollText.tsx uses on the vertical axis.
//
// On mobile, per spec section 13 ("do not force horizontal animation
// where it harms usability"), the scroll-linked movement is disabled
// entirely and this renders as a plain, natural horizontally-scrollable
// row instead (real touch scrolling, no JS-driven translation).
export default function HorizontalScroll({
  items,
  className,
  itemClassName,
}: {
  items: string[];
  className?: string;
  itemClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const viewportScale = useViewportScale();
  const isMobile = viewportScale <= 0.35;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // The track travels from just off the right edge to just off the left
  // edge — the exact distance depends on content length/viewport, so this
  // uses a percentage-based transform rather than a fixed pixel distance.
  const x = useTransform(scrollYProgress, [0, 1], ["8%", "-45%"]);

  const track = (
    <div className="flex items-center gap-10 whitespace-nowrap text-[clamp(28px,6vw,64px)] font-serif font-semibold text-foreground">
      {items.map((item, i) => (
        <Fragment key={item + i}>
          <span className={itemClassName}>{item}</span>
          {i < items.length - 1 && <span className="text-accent opacity-60">→</span>}
        </Fragment>
      ))}
    </div>
  );

  if (reducedMotion || isMobile) {
    return (
      <div className={`overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}>
        {track}
      </div>
    );
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ""}`}>
      <motion.div style={{ x, willChange: "transform" }}>{track}</motion.div>
    </div>
  );
}
