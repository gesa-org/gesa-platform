"use client";

import { useEffect, useState } from "react";
import { MOTION_RESPONSIVE_SCALE } from "@/components/motion/config";

// Phase 45 — spec section 13 ("Responsive Behavior") asks for smaller
// movement distances and tighter stagger on tablet, and fast/simple
// behavior on mobile, rather than one fixed distance everywhere. This
// hook just reports which bucket the current viewport falls into so
// motion primitives can multiply their distance/stagger values down
// instead of duplicating breakpoint logic in every component.
//
// Deliberately uses a plain resize listener rather than matchMedia's
// change event stacking — this only needs to run a handful of times per
// session (on mount + real resizes/rotations), not on every scroll frame,
// so it has no performance overhead the spec is concerned about.
export function useViewportScale() {
  const [scale, setScale] = useState<number>(MOTION_RESPONSIVE_SCALE.desktop);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 640) setScale(MOTION_RESPONSIVE_SCALE.mobile);
      else if (w < 1024) setScale(MOTION_RESPONSIVE_SCALE.tablet);
      else setScale(MOTION_RESPONSIVE_SCALE.desktop);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}
