"use client";

import { useLayoutEffect, useRef } from "react";

// Phase 241 — a small, reusable scroll-parallax primitive for the Donate
// hero's new depth effect (see DonateHeroBackground.tsx). Deliberately
// generic (no Donate-specific knowledge) so it can be reused anywhere else
// on the site a subtle, accessible parallax layer is wanted later.
//
// Design constraints this component exists to satisfy:
// - Only ever animates `transform: translate3d(...) scale(...)` — never
//   `top`/`left`/`background-position`/width/height — so the browser can run
//   the whole effect on the compositor thread without triggering layout.
// - Scroll position is read in a `scroll` listener, but the actual DOM write
//   only ever happens inside a `requestAnimationFrame` callback, and at most
//   one rAF is ever in flight at a time (`rafId` guard) — this is the
//   "eased/interpolated via rAF, not an unthrottled scroll handler" contract
//   from the brief. There is no per-frame React re-render: the transform is
//   written directly to the DOM node via a ref, same performance profile as
//   a hand-rolled canvas/WebGL parallax without needing one.
// - An `IntersectionObserver` gates everything: the scroll listener is only
//   attached while this layer is (nearly) on screen, `will-change: transform`
//   is only set while active, and both are torn down the moment the layer
//   scrolls away — so an off-screen Donate hero costs nothing.
// - `prefers-reduced-motion: reduce` skips both the entrance fade/scale-in
//   and every scroll-linked update entirely; the layer renders at its final
//   resting opacity/transform immediately, still using the exact same
//   markup/CSS a sighted, motion-sensitive visitor would otherwise get.
export interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  /** Total px of translateY travel across the full scroll range (i.e. the
   * layer moves from -strength to +strength as the section crosses the
   * viewport) — keep this small (single digits to low 20s) per the brief's
   * "8–30px of travel" ceiling. Defaults to a conservative 12px. */
  strength?: number;
  /** Optional [start, end] scale applied across the same scroll range,
   * e.g. [1.04, 1] for a far background layer that very slightly zooms out
   * as it scrolls past. Omit for no scale animation. */
  scaleRange?: [number, number];
  /** Purely decorative art (not real content) should be hidden from the
   * accessibility tree and never intercept clicks/selection. */
  decorative?: boolean;
}

const ENTRANCE_MS = 700;

export default function ParallaxLayer({
  children,
  className,
  strength = 12,
  scaleRange,
  decorative = false,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion: settle immediately at the resting transform/opacity —
    // no entrance animation, no scroll listener, no rAF loop at all. Runs in
    // a layout effect (before paint) specifically so a motion-sensitive
    // visitor never sees even a one-frame flash of the hidden/offset state
    // the JSX default below renders for the animated case.
    if (prefersReducedMotion) {
      el.style.transition = "none";
      el.style.opacity = "1";
      el.style.transform = "translate3d(0, 0, 0) scale(1)";
      return;
    }

    let rafId: number | null = null;
    let observerActive = false;
    let entranceTimer: ReturnType<typeof setTimeout> | null = null;

    function computeTransform(): string {
      const rect = el!.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress runs roughly -1 (section well below viewport) .. 0 (section
      // centered in viewport) .. 1 (section well above viewport).
      const center = rect.top + rect.height / 2;
      const raw = (vh / 2 - center) / (vh / 2 + rect.height / 2);
      const progress = Math.max(-1, Math.min(1, raw));
      const translate = progress * strength;
      const scale = scaleRange
        ? scaleRange[0] + (scaleRange[1] - scaleRange[0]) * ((progress + 1) / 2)
        : 1;
      return `translate3d(0, ${translate.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    }

    function tick() {
      rafId = null;
      if (!observerActive || !el) return;
      el.style.transform = computeTransform();
    }

    function onScroll() {
      if (rafId == null) {
        rafId = requestAnimationFrame(tick);
      }
    }

    // Entrance: start very slightly faded/scaled, then transition in once on
    // mount. Set the resting scroll-driven transform as the transition's
    // target so the entrance blends straight into the scroll-linked value
    // instead of snapping afterward.
    el.style.transition = `opacity ${ENTRANCE_MS}ms ease, transform ${ENTRANCE_MS}ms ease`;
    el.style.opacity = "0";
    el.style.transform = "translate3d(0, 6px, 0) scale(1.015)";

    const raf1 = requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = computeTransform();
    });

    // Once the entrance transition finishes, drop the CSS transition so
    // every subsequent scroll-driven update is written instantly per rAF
    // frame — layering a CSS transition on top of a per-frame scroll update
    // would make the effect lag behind the scroll instead of tracking it.
    entranceTimer = setTimeout(() => {
      if (el) el.style.transition = "none";
    }, ENTRANCE_MS + 50);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        observerActive = entry.isIntersecting;
        if (observerActive) {
          el.style.willChange = "transform";
          onScroll();
          window.addEventListener("scroll", onScroll, { passive: true });
        } else {
          window.removeEventListener("scroll", onScroll);
          el.style.willChange = "auto";
          if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      },
      { rootMargin: "25% 0px 25% 0px", threshold: 0 }
    );
    observer.observe(el);

    return () => {
      cancelAnimationFrame(raf1);
      if (entranceTimer) clearTimeout(entranceTimer);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [strength, scaleRange]);

  return (
    <div
      ref={ref}
      className={className}
      aria-hidden={decorative ? true : undefined}
      // Rendered before the layout effect above runs, so this is only ever
      // visible for a real (very old/no-JS) fallback: a fully visible,
      // untransformed layer — never a broken/invisible one.
      style={{ opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
