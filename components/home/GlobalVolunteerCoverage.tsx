"use client";

import { useState, type CSSProperties } from "react";
import { Globe2, HeartHandshake } from "lucide-react";
import {
  GLOBAL_VOLUNTEER_COVERAGE_MARKERS,
  GLOBAL_VOLUNTEER_COVERAGE_METRICS,
  type GlobalVolunteerCoverageMarker,
  type GlobalVolunteerCoverageMetric,
} from "@/lib/globalVolunteerCoverage";

type GlobalVolunteerCoverageProps = {
  markers?: GlobalVolunteerCoverageMarker[];
  metrics?: GlobalVolunteerCoverageMetric[];
};

function markerStyle(marker: GlobalVolunteerCoverageMarker, index: number): CSSProperties {
  return {
    left: `${marker.x}%`,
    top: `${marker.y}%`,
    "--coverage-delay": `${index * 0.38}s`,
  } as CSSProperties;
}

export default function GlobalVolunteerCoverage({
  markers = GLOBAL_VOLUNTEER_COVERAGE_MARKERS,
  metrics = GLOBAL_VOLUNTEER_COVERAGE_METRICS,
}: GlobalVolunteerCoverageProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  return (
    <section aria-labelledby="global-volunteer-coverage-heading" className="overflow-hidden bg-sage-soft py-14 sm:py-18 lg:py-22">
      <div className="wrap grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <div className="min-w-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-clay/50 bg-card/60 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-primary">
            <Globe2 size={15} aria-hidden="true" className="text-clay" />
            Global volunteer network
          </div>
          <h2 id="global-volunteer-coverage-heading" className="max-w-[18ch] text-[clamp(2rem,4vw,3.2rem)] leading-[1.08] text-primary">
            Support That Reaches Around the World
          </h2>
          <p className="mt-5 max-w-[38rem] text-[16px] leading-relaxed text-muted-fg sm:text-[17px]">
            Our volunteer community connects people with compassionate emotional support across borders, time zones,
            and cultures.
          </p>

          <dl className="mt-8 grid gap-3 xs:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-border/80 bg-card/75 px-4 py-4 shadow-soft">
                <dd className="font-serif text-[28px] leading-none text-primary">{metric.value}</dd>
                <dt className="mt-2 text-[12px] font-semibold leading-snug text-muted-fg">{metric.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0">
          <div
            className="global-coverage-map relative mx-auto w-full max-w-[720px] overflow-visible rounded-[28px] border border-border/70 bg-card/55 p-3 shadow-lg sm:p-5"
            aria-label="Stylized world map showing representative GESA volunteer communities across global regions"
          >
            <div className="global-coverage-globe relative aspect-[1.72/1] w-full overflow-visible rounded-[22px] bg-background/40">
              <svg viewBox="0 0 860 500" role="img" aria-hidden="true" className="h-full w-full overflow-visible">
                <defs>
                  <radialGradient id="coverage-glow" cx="50%" cy="45%" r="70%">
                    <stop offset="0%" stopColor="var(--card)" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.35" />
                  </radialGradient>
                  <filter id="coverage-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#2b3140" floodOpacity="0.12" />
                  </filter>
                </defs>
                <ellipse cx="430" cy="250" rx="390" ry="210" fill="url(#coverage-glow)" filter="url(#coverage-shadow)" />
                <ellipse cx="430" cy="250" rx="390" ry="210" fill="none" stroke="var(--accent)" strokeOpacity="0.34" strokeWidth="2" />
                <path d="M42 250h776M74 180h712M74 320h712M196 54c-48 53-73 121-73 196s25 143 73 196M664 54c48 53 73 121 73 196s-25 143-73 196M430 40c-61 53-94 121-94 210s33 157 94 210M430 40c61 53 94 121 94 210s-33 157-94 210" fill="none" stroke="var(--accent)" strokeOpacity="0.16" strokeWidth="1.5" />

                <g className="global-coverage-land" fill="var(--accent)" fillOpacity="0.34" stroke="var(--primary)" strokeOpacity="0.18" strokeWidth="1.5">
                  <path d="M135 132l47-32 58 14 17 33-21 31-8 42-39 23-25-22 8-37-28-15z" />
                  <path d="M223 249l36 22 17 45-8 61-28 66-22-13 6-54-21-44 13-34z" />
                  <path d="M391 126l34-21 47 10 20 23-17 28-7 46-38 8-28-25 8-35-22-16z" />
                  <path d="M419 225l42 7 30 45-5 70-34 68-37-41-8-62 19-42-17-22z" />
                  <path d="M493 163l62-19 64 22 26 31-19 31-53-2-26 29-46-24 6-32-24-19z" />
                  <path d="M554 255l55 6 41 39-24 42-48 13-33-40z" />
                  <path d="M646 179l47-16 58 25 4 43-42 20-48-17-21-27z" />
                  <path d="M697 300l35 15 21 38-37 23-25-30zM739 379l42 13 17 35-42 16-34-25z" />
                </g>

                <g className="global-coverage-arcs" fill="none" stroke="var(--clay)" strokeLinecap="round">
                  <path d="M202 175 Q350 70 480 155" />
                  <path d="M480 155 Q600 95 696 188" />
                  <path d="M480 250 Q585 340 700 300" />
                  <path d="M255 307 Q392 365 515 300" />
                </g>
              </svg>

              {markers.map((marker, index) => {
                const isActive = activeMarker === marker.id;
                const tooltipPosition =
                  marker.tooltipAlign === "start"
                    ? "left-0 translate-x-0"
                    : marker.tooltipAlign === "end"
                      ? "right-0 translate-x-0"
                      : "left-1/2 -translate-x-1/2";

                return (
                  <button
                    key={marker.id}
                    type="button"
                    className="global-coverage-marker group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    style={markerStyle(marker, index)}
                    aria-label={marker.label}
                    aria-pressed={isActive}
                    onClick={() => setActiveMarker(isActive ? null : marker.id)}
                    onFocus={() => setActiveMarker(marker.id)}
                    onBlur={() => setActiveMarker(null)}
                    onMouseEnter={() => setActiveMarker(marker.id)}
                    onMouseLeave={() => setActiveMarker(null)}
                  >
                    <span className="global-coverage-marker-dot" aria-hidden="true" />
                    <span
                      role="tooltip"
                      aria-hidden={!isActive}
                      className={`pointer-events-none absolute bottom-[calc(100%+0.35rem)] ${tooltipPosition} w-max max-w-[min(14rem,calc(100vw-2rem))] rounded-lg border border-border bg-card px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug text-primary shadow-soft transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                    >
                      {marker.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-fg">
            <HeartHandshake size={16} aria-hidden="true" className="mt-0.5 flex-none text-clay" />
            GESA&apos;s volunteer community includes supporters across multiple world regions and time zones.
          </p>
        </div>
      </div>
    </section>
  );
}
