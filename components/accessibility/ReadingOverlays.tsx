"use client";

import { useEffect, useRef } from "react";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";

// Phase 90 — Reading Line and Reading Mask both need to track the pointer,
// which plain CSS can't do — these are the two small overlay elements that
// back those Orientation Modules toggles. Both are `pointer-events: none`
// (see the a11y-reading-line/a11y-reading-mask-* rules in globals.css) and
// `aria-hidden` — they're a visual reading aid only, never a real page
// element, so they must never intercept a click or show up to a screen
// reader. Mounted globally (once, from AccessibilityWidget) rather than
// per-page, same as everything else in this widget.
export default function ReadingOverlays() {
  const { settings } = useAccessibility();
  const lineRef = useRef<HTMLDivElement>(null);
  const maskTopRef = useRef<HTMLDivElement>(null);
  const maskBottomRef = useRef<HTMLDivElement>(null);
  const active = settings.orientation.readingLine || settings.orientation.readingMask;

  useEffect(() => {
    if (!active) return;

    function onMove(e: MouseEvent) {
      const y = e.clientY;
      if (lineRef.current) lineRef.current.style.top = `${y}px`;
      if (maskTopRef.current) maskTopRef.current.style.height = `${Math.max(y - 60, 0)}px`;
      if (maskBottomRef.current) maskBottomRef.current.style.top = `${y + 60}px`;
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [active]);

  if (!active) return null;

  return (
    <>
      {settings.orientation.readingLine && (
        <div ref={lineRef} className="a11y-reading-line" aria-hidden="true" data-testid="a11y-reading-line" />
      )}
      {settings.orientation.readingMask && (
        <>
          <div ref={maskTopRef} className="a11y-reading-mask-panel a11y-reading-mask-top" aria-hidden="true" data-testid="a11y-reading-mask-top" />
          <div ref={maskBottomRef} className="a11y-reading-mask-panel a11y-reading-mask-bottom" aria-hidden="true" data-testid="a11y-reading-mask-bottom" />
        </>
      )}
    </>
  );
}
