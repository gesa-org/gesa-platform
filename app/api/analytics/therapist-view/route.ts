import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLikelyBot } from "@/lib/analytics/botDetect";
import { isRateLimited } from "@/lib/analytics/rateLimit";
import { computeVisitorKey, hashAnonymousId, utcDateString } from "@/lib/analytics/hash";

// Phase 206 — therapist profile-view analytics. Records at most one view
// per (therapist, anonymous visitor, UTC calendar day). Called
// fire-and-forget from components/TherapistViewTracker.tsx, mounted once on
// app/therapists/[slug]/page.tsx — never from the /therapists directory
// itself, so rendering therapist cards never counts as a "view" (only
// opening a specific profile does, per the spec).
//
// Anonymous visitor cookie: a random UUID, httpOnly (never readable by
// client JS — this route is the only thing that ever needs it), first-
// party, no PII of any kind. Generated here on first visit and echoed back
// on every subsequent request via Set-Cookie; the raw value never leaves
// this route or reaches the database — only its salted sha256 hash does
// (see lib/analytics/hash.ts).
const COOKIE_NAME = "gesa-anon-id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const therapistId = body?.therapistId;
  if (!therapistId || typeof therapistId !== "string") {
    return NextResponse.json({ error: "therapistId is required" }, { status: 400 });
  }

  // Rate limit by IP (best effort — see lib/analytics/rateLimit.ts's own
  // comment on this endpoint's real anti-abuse mechanism being the
  // database's unique constraint, not this limiter alone).
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  // Bot/crawler exclusion — respond 204 either way so this is
  // indistinguishable from a normal successful (but deduped) request; no
  // reason to leak bot-detection behavior to whatever sent the request.
  const userAgent = request.headers.get("user-agent");
  if (isLikelyBot(userAgent)) {
    return new NextResponse(null, { status: 204 });
  }

  // Validate the therapist exists and is actually a real, currently-active
  // profile — prevents spamming arbitrary/fake UUIDs into the table.
  const admin = createAdminClient();
  const { data: therapist } = await admin
    .from("therapists")
    .select("id")
    .eq("id", therapistId)
    .eq("is_active", true)
    .maybeSingle();
  if (!therapist) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const existingAnonId = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const anonId = existingAnonId || randomUUID();

  const today = utcDateString();
  const visitorKey = computeVisitorKey(anonId, therapistId, today);
  const anonymousIdHash = hashAnonymousId(anonId);
  const referrer = request.headers.get("referer") || null;

  const { error: insertError } = await admin.from("therapist_profile_views").insert({
    therapist_id: therapistId,
    visitor_key: visitorKey,
    anonymous_id_hash: anonymousIdHash,
    referrer,
  });

  // A unique-constraint violation (23505) means this exact visitor already
  // viewed this therapist today — that's the dedup working as designed, not
  // an error. Matches the existing /api/intake-booking precedent for
  // treating a 23505 as a normal, expected outcome rather than a failure.
  if (insertError && insertError.code !== "23505") {
    console.error("Failed to record therapist profile view:", insertError.message);
    // Still succeed from the caller's point of view — a tracking failure
    // must never surface as a visible error on a public profile page.
  }

  const response = new NextResponse(null, { status: 204 });
  if (!existingAnonId) {
    response.cookies.set(COOKIE_NAME, anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }
  return response;
}
