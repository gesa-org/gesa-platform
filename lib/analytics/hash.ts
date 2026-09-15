import { createHash } from "crypto";

// Phase 206 — therapist profile-view analytics. Same "hash before it ever
// reaches the database" convention as lib/invitations.ts's invitation
// tokens: the raw anonymous cookie value never gets stored anywhere,
// only a one-way sha256 digest of it (plus a server-side-only salt so the
// hash can't be recomputed/correlated by anyone without this secret).
//
// ANALYTICS_HASH_SALT should be set as a real secret in Vercel's env vars.
// Falls back to a fixed string so the feature still works if it's not set
// yet — the hash is defense-in-depth (the anonymous cookie value is
// already random and non-PII on its own), not the sole security boundary,
// so a missing env var degrades this rather than breaking it. Documented
// as a required follow-up in EXECUTION_PLAN.md's Phase 206 entry.
const SALT = process.env.ANALYTICS_HASH_SALT || "gesa-analytics-fallback-salt-v1";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// Persistent (not day-scoped) hash of the anonymous cookie value alone —
// the optional `anonymous_id_hash` column, kept for potential future
// "distinct visitors" aggregates. Never used for the daily-dedup unique
// constraint (see computeVisitorKey below).
export function hashAnonymousId(anonId: string): string {
  return sha256(`${anonId}:${SALT}`);
}

// Phase 207 — the dedup key: encodes visitor + therapist in one
// irreversible hash, so the database's own unique index on
// (therapist_id, visitor_key) is what actually enforces "at most one
// counted visit per therapist per visitor" — not just an application-level
// check a race condition (e.g. two tabs opened at once) could slip past.
//
// No date component as of Phase 207 (Phase 206 originally scoped this to
// "once per calendar day"; superseded by an explicit new instruction for
// "once per browser session" instead). The session granularity now comes
// entirely from the anonymous cookie itself being a *session* cookie (no
// Max-Age — cleared when the browser closes, see
// app/api/analytics/therapist-view/route.ts): a new browser session gets a
// new anonId, which naturally produces a new visitor_key and is allowed to
// count again, with no date math needed here at all.
export function computeVisitorKey(anonId: string, therapistId: string): string {
  return sha256(`${anonId}:${therapistId}:${SALT}`);
}
