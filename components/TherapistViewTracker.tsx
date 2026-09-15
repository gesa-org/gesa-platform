"use client";

import { useEffect, useRef } from "react";

// Phase 206 — mounted once on app/therapists/[slug]/page.tsx (a Server
// Component, so the actual view-tracking side effect has to happen from a
// small client component like this one instead). Fires a single
// fire-and-forget POST on mount, never blocking or delaying the profile
// page's own server-rendered content — this renders nothing and has no
// visual footprint at all. `useRef` guards against React 18 Strict Mode's
// intentional double-invoke of effects in development firing two requests
// for what a visitor experiences as one page load (the database's own
// unique constraint would already dedupe this in production, but there's
// no reason to send the second request at all).
export default function TherapistViewTracker({ therapistId }: { therapistId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
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
