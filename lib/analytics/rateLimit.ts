// Phase 206 — the first rate limiter anywhere in this codebase (confirmed
// via audit — no existing mechanism/middleware to reuse). A simple
// in-memory sliding window keyed by IP address, scoped to the one
// analytics-tracking endpoint that needs it.
//
// Known limitation, documented rather than silently assumed away: Vercel
// serverless functions are ephemeral and can run across multiple
// instances, so this in-memory map is "best effort" per-instance, not a
// perfectly enforced global limit — a determined abuser spread across many
// concurrent cold starts could exceed it. The real anti-abuse mechanism for
// "prevent inflated counts" is the database's own unique constraint on
// (therapist_id, visitor_key) (see the phase_206 migration), which holds
// regardless of this limiter — repeat requests for the same visitor+
// therapist+day are already a no-op at the database level no matter how
// many times they arrive. This limiter's job is narrower: capping how much
// raw request/insert-attempt work one IP can generate, not the view count
// itself. A real distributed limiter (e.g. Upstash Redis) would be a
// reasonable follow-up if this endpoint ever sees abuse in practice.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const hits = new Map<string, number[]>();

// Occasional cleanup so this map doesn't grow unbounded over a long-lived
// serverless instance's lifetime.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) hits.delete(key);
    else hits.set(key, recent);
  }
}

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  sweep(now);
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}
