"use client";

import { useEffect, useRef } from "react";

// Phase 173 — reusable mouse-proximity primitive for the Home hero's
// interactive background icons (components/home/HeroInteractiveIcons.tsx),
// but deliberately generic/dependency-free (no framer-motion, no icon
// assumptions) so it can be reused anywhere else a "things glow/scale near
// the cursor" effect is wanted later.
//
// Design choice: this hook does NOT itself animate anything with JS (no
// per-frame lerp, no React state). Each pointer event schedules at most one
// `requestAnimationFrame` callback, which computes each item's distance from
// the pointer and writes three CSS custom properties directly onto that DOM
// node (`--proximity`, `--push-x`, `--push-y`) via `el.style.setProperty`.
// The actual visible motion — easing in and back out — is a plain CSS
// `transition` on `transform`/`opacity`/`filter` defined by whatever
// classname consumes these variables (see `.hero-proximity-icon` in
// app/globals.css). This keeps the JS side to "how close is the cursor,
// right now" and lets the browser's own compositor handle the smoothing,
// which is both simpler and cheaper than hand-rolled spring/lerp math.
//
// Why refs, not state: updating React state on every pointermove would
// re-render the whole tree behind this hero on every animation frame.
// Writing directly to `element.style` bypasses React entirely for the
// per-frame work — the only React involvement is the one-time effect setup.
export interface ProximityHoverOptions {
  /** Distance in px at which an icon starts reacting to the cursor. */
  radius: number;
  /** Max distance in px an icon is pushed away from the cursor, at zero distance. */
  maxTranslate: number;
  /** Set to false to skip attaching any listeners at all (reduced motion, touch, small screens). */
  enabled: boolean;
}

// Icons here render as inline SVGs (lucide-react forwards its ref to the
// underlying <svg>), so the target type is widened to cover both plain
// elements and SVG elements — both expose `.style`/`getBoundingClientRect()`,
// which is all this hook needs.
export type ProximityTarget = HTMLElement | SVGElement;

// Duck-typed instead of importing React's `RefObject`/`MutableRefObject` —
// both `useRef<T>(initial)` results satisfy this regardless of which of
// those two types a given React version's `.d.ts` resolves it to, so
// callers never have to fight this hook's parameter types.
interface MutableRefLike<T> {
  current: T;
}

export function useProximityHover(
  containerRef: MutableRefLike<HTMLElement | null>,
  itemRefs: MutableRefLike<Array<ProximityTarget | null>>,
  { radius, maxTranslate, enabled }: ProximityHoverOptions
) {
  // Kept in refs (not state) — read inside the rAF callback, never trigger
  // a re-render themselves.
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    function resetAll() {
      for (const el of itemRefs.current) {
        el?.style.setProperty("--proximity", "0");
        el?.style.setProperty("--push-x", "0px");
        el?.style.setProperty("--push-y", "0px");
      }
    }

    function apply() {
      pendingRef.current = false;
      const pointer = pointerRef.current;
      if (!pointer) {
        resetAll();
        return;
      }
      for (const el of itemRefs.current) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const t = Math.max(0, 1 - dist / radius); // 0 = out of range, 1 = right on top of it
        if (t <= 0) {
          el.style.setProperty("--proximity", "0");
          el.style.setProperty("--push-x", "0px");
          el.style.setProperty("--push-y", "0px");
          continue;
        }
        // Restrained "repulsion": nudge the icon away from the pointer,
        // scaled by how close the pointer is (t) and capped at maxTranslate.
        const safeDist = dist || 1;
        const pushX = (-dx / safeDist) * maxTranslate * t;
        const pushY = (-dy / safeDist) * maxTranslate * t;
        el.style.setProperty("--proximity", t.toFixed(3));
        el.style.setProperty("--push-x", `${pushX.toFixed(1)}px`);
        el.style.setProperty("--push-y", `${pushY.toFixed(1)}px`);
      }
    }

    function schedule() {
      if (pendingRef.current) return;
      pendingRef.current = true;
      rafIdRef.current = requestAnimationFrame(apply);
    }

    function handleMove(e: PointerEvent) {
      // Coordinates are viewport-relative (clientX/Y), matched against each
      // icon's own getBoundingClientRect() above — deliberately not just
      // "relative to the hero's top-left," since that's what lets this same
      // math work correctly regardless of where the hero sits on the page.
      pointerRef.current = { x: e.clientX, y: e.clientY };
      schedule();
    }

    function handleLeave() {
      pointerRef.current = null;
      schedule();
    }

    container.addEventListener("pointermove", handleMove, { passive: true });
    container.addEventListener("pointerleave", handleLeave, { passive: true });
    container.addEventListener("pointercancel", handleLeave, { passive: true });

    return () => {
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("pointerleave", handleLeave);
      container.removeEventListener("pointercancel", handleLeave);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      resetAll();
    };
    // itemRefs/containerRef are refs (stable identity) — only the tunable
    // numbers and the enabled flag should ever re-run this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, itemRefs, radius, maxTranslate, enabled]);
}
