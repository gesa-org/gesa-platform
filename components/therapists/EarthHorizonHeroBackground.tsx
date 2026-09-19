"use client";

import { useEffect, useRef } from "react";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";

export const CINEMATIC_EARTH_PLAYBACK_RATE = 0.62;

// The supplied Earth footage provides the realistic texture and continuous
// rotation; CSS owns only the large, horizon-first composition around it.
export default function EarthHorizonHeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useSafeReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncPlayback = () => {
      video.playbackRate = CINEMATIC_EARTH_PLAYBACK_RATE;
      if (reducedMotion || document.hidden) {
        video.pause();
        if (reducedMotion) video.currentTime = 0;
        return;
      }

      video.play().catch(() => {
        // Muted inline playback can still be unavailable in constrained
        // browsers; its first frame remains a complete static fallback.
      });
    };

    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [reducedMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="earth-cinematic-space absolute inset-0" />
      <div className="earth-cinematic-planet absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-full">
        <video
          ref={videoRef}
          autoPlay={!reducedMotion}
          loop
          muted
          playsInline
          preload="metadata"
          className="earth-cinematic-video h-full w-full object-cover"
        >
          <source src="/videos/earth-horizon.mp4" type="video/mp4" />
        </video>
        <div className="earth-cinematic-lighting absolute inset-0" />
      </div>
      <div className="earth-cinematic-rim absolute left-1/2 -translate-x-1/2 rounded-full" />
      <div className="earth-horizon-copy-shade absolute inset-0" />
    </div>
  );
}
