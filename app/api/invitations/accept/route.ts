import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/adminAuditLog";
import { validateInvitationToken, isRateLimited } from "@/lib/invitations";
import { evaluatePassword } from "@/lib/auth/passwordPolicy";

// Phase 187 — the server-side half of /accept-invitation. Deliberately does
// NOT sign the visitor in itself (the service-role client has no concept of
// a browser session/cookies) — it creates the real account and returns
// {email}, and the client page then calls supabase.auth.signInWithPassword
// with the same credentials it just submitted, which is what actually
// establishes the cookie session. This mirrors how AddUserModal's
// temp-password flow works, just automated instead of manual.
//
// Uses the service-role client for every write here: an unauthenticated
// visitor has no profiles row and no RLS-visible session, so — same as
// validateInvitationToken — the token itself (single-use, hashed, expiring)
// is the authorization, not a Postgres role.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token as string | undefined;
  const fullName = (body?.fullName as string | undefined)?.trim() ?? "";
  const password = (body?.password as string | undefined) ?? "";
  const acceptedTerms = body?.acceptedTerms === true;

  if (!token) {
    return NextResponse.json({ error: "Missing invitation token." }, { status: 400 });
  }

  // Best-effort per-token limiter — a token is single-use by design, but
  // this stops a script from hammering the same (possibly guessed) token
  // string hundreds of times per second.
  if (isRateLimited(`accept:${token}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts — please wait a few minutes and try again." }, { status: 429 });
  }

  const validation = await validateInvitationToken(token);
  if (!validation.ok) {
    // Same message regardless of *why* it's invalid (not_found vs a status
    // we don't otherwise expose) collapses down in the UI layer — the page
    // itself (app/accept-invitation/page.tsx) does its own, separate
    // validation pass to decide which friendly copy to show before this
    // form is even rendered; this route's error is just a safety net for a
    // token that changed state between page load and submit (e.g. revoked
    // in the few seconds since).
    return NextResponse.json({ error: "This invitation link is no longer valid." }, { status: 410 });
  }
  const invitation = validation.invitation;

  if (!fullName) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!acceptedTerms) {
    return NextResponse.json({ error: "Please accept the Terms & Conditions and Privacy Policy to continue." }, { status: 400 });
  }
  const { passed } = evaluatePassword(password);
  if (!passed) {
    return NextResponse.json({ error: "Choose a stronger password that meets the requirements." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    const message = /already|exists/i.test(createError?.message ?? "")
      ? "An account already exists for this email — try signing in instead."
      : "Could not create your account — please try again or contact support.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const userId = created.user.id;

  // handle_new_user() already inserted a `profiles` row with role='client'
  // and the full_name above — now explicitly set the real invited role via
  // the service-role client (bypasses the self-escalation-guard trigger by
  // design; see Phase 187's EXECUTION_PLAN.md entry).
  const { error: roleError } = await admin.from("profiles").update({ role: invitation.invited_role, full_name: fullName }).eq("id", userId);
  if (roleError) {
    return NextResponse.json({ error: "Your account was created, but role setup failed — please contact support." }, { status: 500 });
  }

  if (invitation.invited_role === "therapist" && invitation.therapist_profile_id) {
    await admin.from("therapists").update({ profile_id: userId }).eq("id", invitation.therapist_profile_id);
  }

  await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_profile_id: userId })
    .eq("id", invitation.id);

  await logAdminAction(admin, {
    adminId: "system:invitation_accept",
    action: "invitation.accepted",
    targetType: "invitation",
    targetId: invitation.id,
    metadata: { email: invitation.email, invited_role: invitation.invited_role, user_id: userId },
  });

  return NextResponse.json({ ok: true, email: invitation.email, invitedRole: invitation.invited_role });
}
