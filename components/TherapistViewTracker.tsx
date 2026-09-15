"use client";

import { useEffect, useRef } from "react";

// Phase 206/207 — mounted once on app/therapists/[slug]/page.tsx (a Server
// Component, so the actual view-tracking side effect has to happen from a
// small client component like this one instead). Fires a single
// fire-and-forget POST on mount, never blocking or delaying the profile
// page's own server-rendered content — this renders nothing and has no
// visual footprint at all. `useRef` guards against React 18 Strict Mode's
// intentional double-invoke of effects in development firing two requests
// for what a visitor experiences as one page load.
//
// Phase 207 — client-side dedup guard: before firing anything, check
// sessionStorage for this therapist's id. sessionStorage is scoped to one
// tab's session (cleared when the tab/browser closes, and not shared across
// tabs), matching the spec's "count one view per therapist per browser
// session" requirement, and it also means a visitor who refreshes or
// navigates back to a profile they already opened this session never even
// generates a request — the server-side session cookie is a second,
// independent enforcement of the same rule (e.g. across multiple open tabs
// sharing one cookie), not a fallback for this being absent.
const STORAGE_KEY = "gesa-viewed-therapists";

function alreadyViewedThisSession(therapistId: string): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const viewed: string[] = raw ? JSON.parse(raw) : [];
    return viewed.includes(therapistId);
  } catch {
    // Private browsing / storage disabled — fail open and let the request
    // go through; the server-side cookie still dedupes.
    return false;
  }
}

function markViewedThisSession(therapistId: string): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const viewed: string[] = raw ? JSON.parse(raw) : [];
    if (!viewed.includes(therapistId)) {
      viewed.push(therapistId);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(viewed));
    }
  } catch {
    // Non-fatal — worst case the next open this session re-sends a request
    // that the server-side cookie dedup will still no-op.
  }
}

export default function TherapistViewTracker({ therapistId }: { therapistId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    if (alreadyViewedThisSession(therapistId)) return;
    markViewedThisSession(therapistId);

    fetch("/api/analytics/therapist-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ therapistId }),
      keepalive: true,
    }).catch(() => {
      // Never surface a tracking failure to the visitor — this is
      // best-effort analytics, not a feature the page's own success
      // depends on.
    });
  }, [therapistId]);

  return null;
}
