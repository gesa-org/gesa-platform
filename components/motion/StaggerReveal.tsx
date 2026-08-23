"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  REVEAL_VIEWPORT,
} from "@/components/motion/config";

// Phase 45 — staggered group entrance, spec section 3 ("Staggered
// Content") and section 7 ("Card Entrance System"). Two-part API, the
// standard Framer Motion pattern: `StaggerGroup` owns the `whileInView`
// trigger and the `staggerChildren` timing; every direct visual child that
// should animate in wraps its content in `StaggerItem`, which just
// declares the same variant names and inherits the parent's trigger — it
// does not re-trigger on its own. This keeps the "who starts the
// animation" logic in one place per group instead of duplicated
// IntersectionObservers per card.
export function StaggerGroup({
  children,
  className,
  style,
  staggerDelay = MOTION_DURATION.stagger,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  staggerDelay?: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={REVEAL_VIEWPORT}
      variants={{
        visible: {
          transition: {
            staggerChildren: reducedMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  distance = MOTION_DISTANCE.md,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: distance, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{
        duration: reducedMotion ? MOTION_DURATION.micro : MOTION_DURATION.reveal,
        ease: MOTION_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
