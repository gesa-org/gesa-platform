"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useScroll, useSpring, type MotionValue } from "framer-motion";

// Phase 45 — global smooth scrolling, spec section 1.
//
// A deliberate implementation choice, worth explaining: the spec's diagram
// ("Smooth scroll interpolation" between raw input and a normalized
// progress value) is the pattern used by scroll-hijacking libraries like
// Lenis, which replace native scrolling with a `transform`-driven wrapper
// div. This codebase's footer-reveal effect (SiteFooterSlot /
// useRevealHeight, see app/globals.css) and its sticky header + sticky
// filter sidebar (TherapistsDirectory) all depend on real `position:
// fixed`/`sticky` behavior relative to the actual viewport — a transformed
// scroll container breaks that (fixed/sticky children become fixed
// relative to the nearest transformed ancestor instead of the viewport).
// Since "preserve all existing GESA functionality" is the spec's own
// top-priority rule, this deliberately does NOT hijack real scrolling.
//
// Instead: real scrolling stays 100% native (so the page "responds
// immediately," per the spec's own requirement), and the "smooth,
// slightly inertial" feel is applied only to the *derived* progress value
// via a spring — exactly the normalized 0-1 value the spec's diagram asks
// downstream components to consume, just without touching the user's
// actual scroll input. `useScroll()` reads scroll via rAF/MotionValues
// internally (no React state, no per-scroll-event re-render), which is
// the same performance property the spec asks for in section 12.
const ScrollProgressContext = createContext<MotionValue<number> | null>(null);

export function useGlobalScrollProgress() {
  return useContext(ScrollProgressContext);
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const { scrollYProgress } = useScroll();
  // A light spring turns the raw 0-1 progress into a slightly trailing,
  // "inertial" value — this is what gives components consuming it (e.g. a
  // future progress indicator) the calm, weighted feel the spec describes,
  // without ever delaying the actual page scroll itself.
  const smoothed = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  return <ScrollProgressContext.Provider value={smoothed}>{children}</ScrollProgressContext.Provider>;
}
