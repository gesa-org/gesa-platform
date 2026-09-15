import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAndSendGuardianConsent, baseUrlFromRequest } from "@/lib/guardianConsent";
import { isValidEmailFormat } from "@/lib/email/resend";
import { isRateLimited } from "@/lib/invitations";

// Phase 214 — called by CreateAccountForm.tsx immediately after a minor's
// Supabase Auth account is created (signUp already ran; the account's
// `profiles` row exists with account_status "pending_guardian_consent" —
// see handle_new_user()'s Phase 214 update). This route creates the
// guardian_consents row and sends the guardian their consent email.
//
// Deliberately re-checks account_status server-side rather than trusting
// the client's own branching logic: the only thing authorizing this call is
// "profileId names a real profile that is actually pending guardian
// consent right now" — a forged/replayed request against an already-active
// or nonexistent profile is rejected before any email goes out.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const profileId = body?.profileId as string | undefined;
  const minorName = (body?.minorName as string | undefined) ?? null;
  const guardianFullName = (body?.guardianFullName as string | undefined)?.trim();
  const guardianEmail = body?.guardianEmail as string | undefined;
  const guardianRelationship = (body?.guardianRelationship as string | undefined)?.trim();

  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }
  if (!guardianFullName || !guardianRelationship) {
    return NextResponse.json({ error: "Guardian name and relationship are required" }, { status: 400 });
  }
  if (!isValidEmailFormat(guardianEmail)) {
    return NextResponse.json({ error: "A valid guardian email is required" }, { status: 400 });
  }

  if (isRateLimited(`guardian-consent:${profileId}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — please try again later." }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, account_status").eq("id", profileId).maybeSingle();
  if (!profile || profile.account_status !== "pending_guardian_consent") {
    // Neutral response — this is public-facing input, and revealing exactly
    // why (no such profile vs. already active) would let a caller probe
    // profile IDs/account states. The signup flow that calls this already
    // knows the profile it just created, so this branch only fires for a
    // forged/stale request.
    return NextResponse.json({ ok: true });
  }

  const result = await createAndSendGuardianConsent({
    profileId,
    minorName,
    guardianFullName,
    guardianEmail: guardianEmail as string,
    guardianRelationship,
    baseUrl: baseUrlFromRequest(request),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
