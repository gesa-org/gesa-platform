"use client";

import { useEffect, useRef, useState } from "react";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";

export const EARTH_HORIZON_ROTATION_PLAYBACK_RATE = 0.82;
export const THERAPIST_LIGHT_HOLD_MS = 5_000;
export const THERAPIST_LIGHT_FADE_MS = 900;

// Ordered by adjacent regions so the decorative coverage signal travels in a
// deliberate path rather than flashing randomly across the globe.
export const THERAPIST_COVERAGE_LIGHT_SEQUENCE = [
  { id: "north-america", left: "22%", top: "62%" },
  { id: "latin-america", left: "31%", top: "73%" },
  { id: "western-europe", left: "46%", top: "54%" },
  { id: "africa", left: "50%", top: "70%" },
  { id: "middle-east", left: "57%", top: "62%" },
  { id: "south-asia", left: "65%", top: "69%" },
  { id: "east-asia", left: "75%", top: "59%" },
  { id: "southeast-asia", left: "77%", top: "73%" },
  { id: "oceania", left: "85%", top: "79%" },
] as const;

// The supplied horizon loop is decorative. It remains a calm, static first
// frame for people who request reduced motion while preserving the hero copy.
export default function EarthHorizonHeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useSafeReducedMotion();
  const [{ activeLight, fadingLight }, setLights] = useState({
    activeLight: 0,
    fadingLight: null as number | null,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncPlayback = () => {
      video.playbackRate = EARTH_HORIZON_ROTATION_PLAYBACK_RATE;
      if (reducedMotion || document.hidden) {
        video.pause();
        if (reducedMotion) video.currentTime = 0;
        return;
      }

      video.play().catch(() => {
        // Autoplay can be blocked in a constrained browser; the static frame
        // remains a complete, decorative background in that case.
      });
    };

    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      setLights((current) => ({ ...current, fadingLight: null }));
      return;
    }

    const interval = window.setInterval(() => {
      setLights((current) => ({
        activeLight: (current.activeLight + 1) % THERAPIST_COVERAGE_LIGHT_SEQUENCE.length,
        fadingLight: current.activeLight,
      }));
    }, THERAPIST_LIGHT_HOLD_MS);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (fadingLight === null) return;
    const timeout = window.setTimeout(() => {
      setLights((current) =>
        current.fadingLight === fadingLight ? { ...current, fadingLight: null } : current,
      );
    }, THERAPIST_LIGHT_FADE_MS);
    return () => window.clearTimeout(timeout);
  }, [fadingLight]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="earth-horizon-space absolute inset-0" />
      <div className="earth-horizon-stars absolute inset-0" />
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
      <div className="earth-horizon-atmosphere absolute inset-0" />
      {!reducedMotion && (
        <div className="earth-coverage-lights absolute inset-0">
          {THERAPIST_COVERAGE_LIGHT_SEQUENCE.map((light, index) => {
            const state = index === activeLight ? "is-active" : index === fadingLight ? "is-fading" : "is-hidden";
            return (
              <span
                key={light.id}
                className={`earth-coverage-light ${state}`}
                style={{ left: light.left, top: light.top }}
              >
                <span className="earth-coverage-light__glow" />
                <span className="earth-coverage-light__core" />
              </span>
            );
          })}
        </div>
      )}
      <div className="earth-horizon-copy-shade absolute inset-0" />
    </div>
  );
}
