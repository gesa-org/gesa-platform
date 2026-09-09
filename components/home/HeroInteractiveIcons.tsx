"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Heart, MessageCircle, Sparkle, Star, Users2, Waves, HeartHandshake, Circle } from "lucide-react";
import { useProximityHover, type ProximityTarget } from "@/components/motion/useProximityHover";

// Phase 173 — Roy asked for an interactive hero background on the Home page
// ("About" nav item, this file's only consumer is components/home/Paths.tsx)
// styled after the existing decorative watermark texture used on Find
// Support / Our Professionals / Community (GoldWatermarks.tsx), but reacting
// to the cursor: icons near the pointer gently brighten, scale up, glow, and
// nudge away from it; everywhere else they sit at the same low-opacity
// "background texture" level GoldWatermarks already established.
//
// This is a separate component rather than an extension of GoldWatermarks
// because GoldWatermarks is shared, static, and intentionally identical
// across every gold-banner page — bolting cursor-tracking onto it would
// mean either making every other page pay for pointer listeners it doesn't
// use, or threading an `interactive` prop through a component whose whole
// value is being the same simple thing everywhere. GoldWatermarks itself is
// untouched; this only replaces its one usage inside Paths.tsx's hero.
//
// ---- Tuning ----------------------------------------------------------
// Every value that shapes the *feel* of the effect lives here, named, in
// one place:
//   RADIUS_PX        — how close the cursor must get before an icon reacts.
//   MAX_TRANSLATE_PX — how far an icon is nudged away from the cursor at
//                       zero distance (scales down to 0 at RADIUS_PX away).
// The rest (opacity range, scale range, glow size/color) are CSS custom
// properties set per-icon below and consumed by `.hero-proximity-icon` in
// app/globals.css — see that rule's comment for how they combine.
const RADIUS_PX = 190;
const MAX_TRANSLATE_PX = 16;

// Icon set — one from each category Roy asked for: care/hearts, chat/
// community conversation, positive-emotion sparkle/star, connected-people,
// and a calm abstract shape (a plain ring) plus a wave for "calm abstract
// circles, waves." Position/size/opacity/rotation are varied per instance
// (not per icon type) so the layout doesn't feel like a repeated tile,
// following the same "scattered, avoid the center, low opacity" pattern
// GoldWatermarks already uses on every other gold section.
const ICONS: Array<{
  Icon: typeof Heart;
  className: string; // Tailwind position/size utility classes only
  rotate: number; // deg
  baseOpacity: number;
  maxOpacity: number;
  maxScale: number; // e.g. 0.15 = grows to 115% at closest range
}> = [
  { Icon: Heart, className: "left-[5%] top-[14%] h-9 w-9", rotate: -8, baseOpacity: 0.08, maxOpacity: 0.36, maxScale: 0.18 },
  { Icon: MessageCircle, className: "left-[16%] top-[62%] h-10 w-10", rotate: 6, baseOpacity: 0.07, maxOpacity: 0.32, maxScale: 0.15 },
  { Icon: Sparkle, className: "left-[3%] top-[42%] h-6 w-6", rotate: 0, baseOpacity: 0.1, maxOpacity: 0.4, maxScale: 0.2 },
  { Icon: Star, className: "right-[6%] top-[20%] h-7 w-7", rotate: 12, baseOpacity: 0.08, maxOpacity: 0.34, maxScale: 0.18 },
  { Icon: Users2, className: "right-[16%] top-[66%] h-10 w-10", rotate: -5, baseOpacity: 0.07, maxOpacity: 0.3, maxScale: 0.14 },
  { Icon: Waves, className: "right-[3%] top-[44%] h-9 w-9", rotate: 0, baseOpacity: 0.08, maxOpacity: 0.32, maxScale: 0.15 },
  { Icon: HeartHandshake, className: "left-[24%] top-[10%] h-8 w-8", rotate: -10, baseOpacity: 0.06, maxOpacity: 0.28, maxScale: 0.14 },
  { Icon: Circle, className: "right-[26%] top-[8%] h-14 w-14", rotate: 0, baseOpacity: 0.05, maxOpacity: 0.22, maxScale: 0.1 },
  { Icon: Sparkle, className: "left-[10%] top-[80%] h-5 w-5", rotate: 20, baseOpacity: 0.09, maxOpacity: 0.36, maxScale: 0.2 },
];

// Cursor-following is a desktop/mouse affordance — spec section 14 (reduced
// motion) and plain usability both call for skipping it on touch-only
// devices and under prefers-reduced-motion. matchMedia is read once on
// mount; the icons still render either way, just static (their CSS default
// --proximity: 0 state) when this is false.
function usePointerInteractionAllowed() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowed(fine.matches && !reduced.matches);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return allowed;
}

export default function HeroInteractiveIcons() {
  // This component renders inside Paths.tsx's `.gold-banner.home-hero`
  // section but doesn't receive a ref to it (that div is rendered by a
  // server component, which can't hold refs) — instead each icon anchors
  // to itself, and on mount we walk up to the nearest `.home-hero` ancestor
  // via `closest()`, a plain DOM call that works regardless of which
  // component rendered that ancestor.
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<ProximityTarget | null>>([]);
  const allowed = usePointerInteractionAllowed();

  useEffect(() => {
    containerRef.current = anchorRef.current?.closest(".home-hero") ?? null;
  }, []);

  useProximityHover(containerRef, itemRefs, {
    radius: RADIUS_PX,
    maxTranslate: MAX_TRANSLATE_PX,
    enabled: allowed,
  });

  return (
    <div ref={anchorRef} aria-hidden="true" className="contents">
      {ICONS.map(({ Icon, className, rotate, baseOpacity, maxOpacity, maxScale }, i) => (
        <Icon
          key={i}
          aria-hidden="true"
          strokeWidth={1}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          className={`hero-proximity-icon absolute text-foreground ${className}`}
          style={
            {
              "--icon-rotate": `${rotate}deg`,
              "--icon-base-opacity": baseOpacity,
              "--icon-max-opacity": maxOpacity,
              "--icon-max-scale": maxScale,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
