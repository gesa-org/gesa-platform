"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Phase 176 — root-cause fix for a site-wide hydration failure that was
// silently breaking every client interaction on every page (not just the
// "Load more" button on /therapists), see EXECUTION_PLAN.md Phase 176 for
// the full investigation writeup.
//
// framer-motion's own `useReducedMotion()` reads `window.matchMedia(...)`
// *synchronously during render* (not inside an effect), so on the very
// first client render it can already return a real `true`/`false` — while
// the server, which has no `window`, always returns `null`. Every motion
// primitive in this folder (Reveal, StaggerGroup/StaggerItem, ParallaxLayer)
// used that raw value to decide which variant/style to render, so for any
// visitor (or automated browser) whose OS/browser reports
// `prefers-reduced-motion: reduce`, the server rendered the full-motion
// "hidden" style (e.g. `opacity:0; transform: translateY(52px) scale(0.97)`)
// while the client's first hydration pass rendered the reduced-motion style
// (`opacity:0` only, no transform) for the exact same node — a genuine
// attribute mismatch. The global Footer alone renders roughly a dozen of
// these nodes on *every* route, so a reduced-motion visitor hit a dozen
// simultaneous mismatches on first load; React logged hydration errors,
// tried to recover by fully client-rendering the root, and that recovery
// itself failed (observed in production as React error #329, "Unknown root
// exit status") — leaving the whole page's React root dead: no effects ever
// ran, so `whileInView` observers never attached (cards stuck at
// `opacity:0` forever, confirmed by direct DOM inspection) and no click
// handlers ever attached either (confirmed: clicking the real "Load more"
// button produced zero DOM change).
//
// The fix: never let the real reduced-motion preference affect the very
// first client render. This hook always reports `false` (full motion, same
// as the server's `Boolean(null)`) until after mount, then swaps to the
// real value once an effect has run — by which point hydration has already
// succeeded, so there is nothing left to mismatch. The only visible cost is
// that a reduced-motion visitor's very first paint uses the full-motion
// "hidden" variant for one tick before switching to the reduced one — since
// nothing has animated into view yet at that point, this is imperceptible.
export function useSafeReducedMotion(): boolean {
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? Boolean(reduced) : false;
}
