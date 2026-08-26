"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import type { ReactNode } from "react";
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SCALE_SUBTLE,
  REVEAL_VIEWPORT,
} from "@/components/motion/config";

export type RevealType = "fade" | "fade-up" | "fade-scale" | "horizontal" | "horizontal-right" | "image";

const DISTANCE_BY_SIZE = { sm: MOTION_DISTANCE.sm, md: MOTION_DISTANCE.md, lg: MOTION_DISTANCE.lg };

function buildVariants(type: RevealType, distance: number, reduced: boolean) {
  if (reduced) {
    // Spec section 14: under reduced motion, keep opacity transitions
    // short, drop all movement/scale/parallax entirely.
    return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  }
  switch (type) {
    case "fade":
      return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    case "fade-scale":
      return {
        hidden: { opacity: 0, scale: MOTION_SCALE_SUBTLE },
        visible: { opacity: 1, scale: 1 },
      };
    case "horizontal":
      return { hidden: { opacity: 0, x: -distance }, visible: { opacity: 1, x: 0 } };
    // Phase 66 — Our Founders' alternating rows needed a "slide in from the
    // right" counterpart to the existing left-only "horizontal" type (used
    // for the second/even founder row, so entries visibly slide in from
    // opposite sides rather than all sliding the same direction).
    case "horizontal-right":
      return { hidden: { opacity: 0, x: distance }, visible: { opacity: 1, x: 0 } };
    case "image":
      return {
        hidden: { opacity: 0, scale: 1.04, y: distance * 0.5 },
        visible: { opacity: 1, scale: 1, y: 0 },
      };
    case "fade-up":
    default:
      return { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } };
  }
}

// Phase 45 — the general-purpose "reveal on scroll into view" primitive,
// spec section 2. Every supported `type` maps to the spec's own list
// (fade / fade+up / fade+scale / horizontal / image). Deliberately kept to
// small, subtle offsets (see components/motion/config.ts) — the spec is
// explicit that "the goal is refinement rather than spectacle."
const TAG_MAP = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  li: motion.li,
} as const;

export default function Reveal({
  children,
  type = "fade-up",
  distance = "md",
  duration = MOTION_DURATION.reveal,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  type?: RevealType;
  distance?: keyof typeof DISTANCE_BY_SIZE | number;
  duration?: number;
  delay?: number;
  className?: string;
  as?: keyof typeof TAG_MAP;
}) {
  const Component = TAG_MAP[as];
  const reducedMotion = useReducedMotion();
  const px = typeof distance === "number" ? distance : DISTANCE_BY_SIZE[distance];
  const variants = buildVariants(type, px, Boolean(reducedMotion));
  const transition: Transition = {
    duration: reducedMotion ? Math.min(duration, MOTION_DURATION.micro) : duration,
    delay: reducedMotion ? 0 : delay,
    ease: MOTION_EASE,
  };

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </Component>
  );
}
