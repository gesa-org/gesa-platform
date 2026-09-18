import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isLikelyBot } from "@/lib/analytics/botDetect";
import { isRateLimited } from "@/lib/analytics/rateLimit";
import { computeVisitorKey, hashAnonymousId } from "@/lib/analytics/hash";

// Profile-view analytics. Totals are deliberately returned only through the
// owner-only /api/analytics/my-profile-views endpoint.
// Records at most one view per (therapist, anonymous visitor, browser
// session). Called fire-and-forget from components/TherapistViewTracker.tsx,
// mounted once on app/therapists/[slug]/page.tsx — never from the
// /therapists directory itself, so rendering therapist cards never counts
// as a "view" (only opening a specific profile does).
//
// Anonymous visitor cookie: a random UUID, httpOnly (never readable by
// client JS — this route is the only thing that ever needs it), first-
// party, no PII of any kind, and — as of Phase 207 — a *session* cookie
// (no Max-Age, so browsers clear it when closed), matching the new "once
// per browser session, not once per day" dedup requirement. The raw value
// never leaves this route or reaches the database — only its salted sha256
// hash does (see lib/analytics/hash.ts).
const COOKIE_NAME = "gesa-anon-id";

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

  // Bot/crawler exclusion — respond with the same shape either way so this
  // is indistinguishable from a normal (but excluded) request; no reason to
  // leak bot-detection behavior to whatever sent the request.
  const userAgent = request.headers.get("user-agent");
  if (isLikelyBot(userAgent)) {
    return NextResponse.json({ recorded: false });
  }

  // Phase 207 — exclude internal users: admins/reviewers/CRM staff, and a
  // signed-in therapist viewing their own profile. Uses the requester's own
  // cookie-based session (not the service-role client) purely to read
  // "who, if anyone, is signed in" — this never grants extra access, it
  // only decides whether to skip counting.
  const profile = await getCurrentProfile();
  const admin = createAdminClient();

  if (profile) {
    const internalRoles = ["admin", "super_admin", "reviewer", "finance"];
    if (internalRoles.includes(profile.role)) {
      return NextResponse.json({ recorded: false });
    }
    if (profile.role === "therapist") {
      const { data: ownTherapistRecord } = await admin
        .from("therapists")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();
      if (ownTherapistRecord?.id === therapistId) {
        return NextResponse.json({ recorded: false });
      }
    }
  }

  // Validate the therapist exists and is actually a real, currently-active
  // profile — prevents spamming arbitrary/fake UUIDs into the table.
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

  const visitorKey = computeVisitorKey(anonId, therapistId);
  const anonymousIdHash = hashAnonymousId(anonId);
  const referrer = request.headers.get("referer") || null;

  // Phase 207 — single atomic RPC: inserts the granular event row (a
  // no-op on conflict) and, only when that insert actually happened,
  // increments therapists.profile_views in the same call — see the
  // phase_207 migration's own comment on why this can never drift.
  const { error: rpcError } = await admin.rpc("record_therapist_profile_view", {
    p_therapist_id: therapistId,
    p_visitor_key: visitorKey,
    p_anonymous_id_hash: anonymousIdHash,
    p_referrer: referrer,
  });

  if (rpcError) {
    console.error("Failed to record therapist profile view:", rpcError.message);
    // Still succeed from the caller's point of view — a tracking failure
    // must never surface as a visible error on a public profile page.
  }

  const response = NextResponse.json({ recorded: !rpcError });
  if (!existingAnonId) {
    // No `maxAge`/`expires` set — a session cookie, cleared when the
    // browser closes, so a new browser session naturally gets a new anonId
    // and is allowed to count again (see lib/analytics/hash.ts's comment).
    response.cookies.set(COOKIE_NAME, anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return response;
}
