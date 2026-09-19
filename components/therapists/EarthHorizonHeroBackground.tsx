"use client";

import { useEffect, useRef } from "react";
import { geoOrthographic, geoPath } from "d3-geo";
import type { GeometryCollection, Topology } from "topojson-specification";
import { feature, mesh } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion";

const GLOBE_WIDTH = 720;
const GLOBE_HEIGHT = 560;
const GLOBE_CENTER_X = GLOBE_WIDTH / 2;
const GLOBE_CENTER_Y = 392;
const GLOBE_RADIUS = 322;
const GLOBE_INITIAL_ROTATION = -18;
const GLOBE_TILT = -16;
const GLOBE_ROTATION_DEGREES_PER_SECOND = 0.55;
const DESKTOP_FRAME_INTERVAL_MS = 1000 / 24;
const MOBILE_FRAME_INTERVAL_MS = 1000 / 16;

type WorldAtlasObjects = {
  countries: GeometryCollection;
  land: GeometryCollection;
};

const topology = worldAtlas as unknown as Topology<WorldAtlasObjects>;
const land = feature(topology, topology.objects.land);
const countryBorders = mesh(topology, topology.objects.countries, (first, second) => first !== second);

function createProjection() {
  return geoOrthographic()
    .translate([GLOBE_CENTER_X, GLOBE_CENTER_Y])
    .scale(GLOBE_RADIUS)
    .clipAngle(90)
    .precision(0.25);
}

const initialProjection = createProjection().rotate([GLOBE_INITIAL_ROTATION, GLOBE_TILT]);
const initialPath = geoPath(initialProjection);
const INITIAL_LAND_PATH = initialPath(land) ?? "";
const INITIAL_BORDER_PATH = initialPath(countryBorders) ?? "";

function setPathData(element: SVGPathElement | null, pathData: string | null) {
  if (element) element.setAttribute("d", pathData ?? "");
}

// A low-detail, bundled world atlas is deliberately used here: it is accurate
// enough for recognizable national borders while staying smooth on phones.
export default function EarthHorizonHeroBackground() {
  const landRef = useRef<SVGPathElement>(null);
  const borderGlowRef = useRef<SVGPathElement>(null);
  const borderRef = useRef<SVGPathElement>(null);
  const reducedMotion = useSafeReducedMotion();

  useEffect(() => {
    const projection = createProjection();
    const path = geoPath(projection);

    const draw = (rotation: number) => {
      projection.rotate([rotation, GLOBE_TILT]);
      setPathData(landRef.current, path(land));
      const borders = path(countryBorders);
      setPathData(borderGlowRef.current, borders);
      setPathData(borderRef.current, borders);
    };

    draw(GLOBE_INITIAL_ROTATION);
    if (reducedMotion) return;

    let animationFrame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let lastDraw = 0;
    const isMobile = typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches;
    const frameInterval = isMobile
      ? MOBILE_FRAME_INTERVAL_MS
      : DESKTOP_FRAME_INTERVAL_MS;

    const tick = (time: number) => {
      if (previousTime) elapsed += time - previousTime;
      previousTime = time;

      if (time - lastDraw >= frameInterval) {
        draw(GLOBE_INITIAL_ROTATION + (elapsed / 1000) * GLOBE_ROTATION_DEGREES_PER_SECOND);
        lastDraw = time;
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!document.hidden && !animationFrame) animationFrame = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      previousTime = 0;
    };
    const handleVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reducedMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="earth-horizon-sky absolute inset-0" />
      <svg
        className="earth-horizon-globe absolute inset-x-0 bottom-0 h-full w-full"
        viewBox={`0 0 ${GLOBE_WIDTH} ${GLOBE_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
      >
        <defs>
          <radialGradient id="earth-ocean" cx="42%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#6ba5c8" />
            <stop offset="57%" stopColor="#315f87" />
            <stop offset="100%" stopColor="#183a5c" />
          </radialGradient>
          <linearGradient id="earth-land" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#9caf86" />
            <stop offset="52%" stopColor="#667d5e" />
            <stop offset="100%" stopColor="#405e54" />
          </linearGradient>
          <filter id="earth-border-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          <clipPath id="earth-surface-clip">
            <circle cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r={GLOBE_RADIUS} />
          </clipPath>
        </defs>
        <circle className="earth-horizon-ocean" cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r={GLOBE_RADIUS} />
        <g clipPath="url(#earth-surface-clip)">
          <path ref={landRef} d={INITIAL_LAND_PATH} className="earth-horizon-land" />
          <path ref={borderGlowRef} d={INITIAL_BORDER_PATH} className="earth-horizon-borders earth-horizon-borders--glow" />
          <path ref={borderRef} d={INITIAL_BORDER_PATH} className="earth-horizon-borders" />
        </g>
        <circle className="earth-horizon-rim" cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r={GLOBE_RADIUS} />
      </svg>
      <div className="earth-horizon-copy-shade absolute inset-0" />
    </div>
  );
}
