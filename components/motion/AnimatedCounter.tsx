"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MOTION_DURATION, MOTION_EASE } from "@/components/motion/config";

function parseNumeric(value: string) {
  const match = value.match(/[\d,.]+/);
  if (!match) return null;
  const numStr = match[0].replace(/,/g, "");
  const num = parseFloat(numStr);
  if (Number.isNaN(num)) return null;
  const start = match.index ?? 0;
  return {
    prefix: value.slice(0, start),
    suffix: value.slice(start + match[0].length),
    number: num,
    raw: match[0],
    isInteger: Number.isInteger(num),
  };
}

// Phase 45 — number count-up on scroll-into-view, spec section 8
// ("Statistics / Metrics"). Deliberately generic over the *string* value
// a stat already displays (e.g. "200+", "6", "Global") rather than
// requiring a separate numeric prop — components/home/Stats.tsx's
// existing values mix real numbers with at least one plain word
// ("Global"), and the spec is explicit not to invent or modify any
// existing numerical content. Any prefix/suffix around the number (a "+",
// a "%", etc.) is preserved and rendered statically; only the numeric
// portion itself animates. If no number is found in the string at all,
// this renders the original string unchanged — no animation, no crash.
export default function AnimatedCounter({
  value,
  duration = MOTION_DURATION.large,
  className,
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reducedMotion = useReducedMotion();
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(parsed ? "0" : value);

  useEffect(() => {
    if (!parsed || !inView) return;
    if (reducedMotion) {
      setDisplay(parsed.raw);
      return;
    }
    const controls = animate(0, parsed.number, {
      duration,
      ease: MOTION_EASE,
      onUpdate(latest) {
        setDisplay(
          parsed.isInteger ? Math.round(latest).toLocaleString() : latest.toFixed(1)
        );
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reducedMotion]);

  if (!parsed) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  );
}
