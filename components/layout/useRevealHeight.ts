"use client";

import { useEffect, useRef } from "react";

// Measures the actual rendered height of the gift-band + footer reveal layer
// and publishes it as --reveal-height on :root, so each opted-in page's
// reserved bottom margin always matches the real footer height instead of a
// guessed constant. A ResizeObserver only — deliberately not a scroll
// listener — since this only needs to react to layout/content changes
// (e.g. footer copy wrapping differently at a given width), not scroll
// position. Returns a ref to attach to the reveal layer's root element.
//
// Moved here from components/home/ in Phase 34 when the footer reveal
// effect (originally Home-only, Phase 29) was extended to About, Our
// Therapists, and Support Groups — this hook was never actually
// Home-specific, just named that way before other pages used it too.
export function useRevealHeight(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const setHeight = () => {
      document.documentElement.style.setProperty("--reveal-height", `${el.offsetHeight}px`);
    };
    setHeight();

    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--reveal-height");
    };
  }, [active]);

  return ref;
}
