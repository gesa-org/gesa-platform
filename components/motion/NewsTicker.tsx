"use client";

import { Fragment } from "react";
import { useReducedMotion } from "framer-motion";

// Phase 51 — continuous "news line" ticker for Home, replacing the old
// scroll-linked row (components/motion/HorizontalScroll.tsx, Phase 45)
// that just repeated the trust badges + card titles already visible
// elsewhere on the page. Roy flagged that repeat as redundant and asked
// for a real continuously-scrolling ticker instead, about GESA's purpose
// rather than a recap of nearby UI copy.
//
// Content comes from `homeContent.purposeTicker` (site_content key
// "page_home") — see the fallback in components/home/Paths.tsx for the
// actual phrases, each one distilled from GESA's existing, already-
// published mission copy (About page's mission paragraphs, the "how it
// works" points, and the footer note) rather than invented claims.
//
// This is a genuine infinite marquee, not scroll-linked: the track holds
// the item list twice back-to-back and animates a flat -50% translateX
// on a CSS loop (see .news-ticker-track in app/globals.css) — with both
// halves identical, the loop point is invisible. The second copy is
// aria-hidden so screen readers only hear the phrases once. Paused on
// hover/focus so a reader can actually finish a phrase before it moves
// on, and drops the animation entirely under prefers-reduced-motion,
// falling back to the same plain, real-touch-scrollable row every other
// motion primitive in this codebase uses for that case (see
// HorizontalScroll.tsx's identical fallback).
export default function NewsTicker({
  items,
  className,
  separator = "•",
}: {
  items: string[];
  className?: string;
  separator?: string;
}) {
  const reducedMotion = useReducedMotion();
  const clean = items.map((s) => s.trim()).filter(Boolean);
  if (clean.length === 0) return null;

  const renderRow = (ariaHidden: boolean) => (
    <div className="flex items-center gap-8 whitespace-nowrap pr-8" aria-hidden={ariaHidden}>
      {clean.map((item, i) => (
        <Fragment key={i}>
          <span className="text-[14px] md:text-[15.5px] font-semibold uppercase tracking-[0.06em] text-foreground">
            {item}
          </span>
          <span className="text-accent" aria-hidden="true">
            {separator}
          </span>
        </Fragment>
      ))}
    </div>
  );

  if (reducedMotion) {
    return (
      <div
        className={`overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
      >
        {renderRow(false)}
      </div>
    );
  }

  return (
    <div className={`news-ticker overflow-hidden ${className ?? ""}`}>
      <div className="news-ticker-track">
        {renderRow(false)}
        {renderRow(true)}
      </div>
    </div>
  );
}
