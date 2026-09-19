"use client";

import { useEffect, useRef } from "react";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";

// The supplied horizon loop is decorative. It remains a calm, static first
// frame for people who request reduced motion while preserving the hero copy.
export default function EarthHorizonHeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useSafeReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reducedMotion) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    video.play().catch(() => {
      // Autoplay can be blocked in a constrained browser; the static frame
      // remains a complete, decorative background in that case.
    });
  }, [reducedMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay={!reducedMotion}
        loop
        muted
        playsInline
        preload="metadata"
        className="earth-horizon-video h-full w-full object-cover object-[center_60%]"
      >
        <source src="/videos/earth-horizon.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(170,184,197,0.56)_0%,rgba(170,184,197,0.34)_48%,rgba(170,184,197,0.52)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(238,241,246,0.10)_0%,rgba(43,49,64,0.17)_100%)]" />
    </div>
  );
}
