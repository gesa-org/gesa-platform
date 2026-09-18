"use client";

import { useEffect, useState } from "react";
import { MOBILE_PARALLAX_MEDIA_QUERY, MOBILE_PARALLAX_SPEED_FACTOR } from "@/components/motion/config";

// Kept separate from generic reveal sizing: this controls only the shared,
// scroll-linked decorative backgrounds. It reads once on mount and on actual
// breakpoint changes—not while scrolling—so it adds no work to each frame.
// Starting at 1 also matches the server render and avoids hydration drift.
export function useMobileParallaxFactor() {
  const [factor, setFactor] = useState(1);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia(MOBILE_PARALLAX_MEDIA_QUERY);
    const updateFactor = () => setFactor(mediaQuery.matches ? MOBILE_PARALLAX_SPEED_FACTOR : 1);

    updateFactor();
    mediaQuery.addEventListener("change", updateFactor);
    return () => mediaQuery.removeEventListener("change", updateFactor);
  }, []);

  return factor;
}
