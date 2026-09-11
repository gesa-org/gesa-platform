import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/adminAuditLog";
import { generateInvitationToken, hashInvitationToken, invitationExpiryDate, baseUrlFromRequest, isRateLimited } from "@/lib/invitations";
import { sendEmailSafely } from "@/lib/email/resend";
import { therapistInvitationEmail, administratorInvitationEmail } from "@/lib/email/templates";

// Phase 187 — "Resend invitation." Issues a *new* token (the old one is
// immediately invalid — this updates the same row's token_hash rather than
// inserting a second row, so there is never more than one live token per
// invitation) and re-sends the email. Does not reset resend_count's
// cooldown beyond the shared rate limiter below; the spec's "safe Resend
// invitation option instead of creating duplicates" is what this route is
// for — the CRM should call this, not the plain create route, once an
// active invitation already exists for that email/role.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin" && me.role !== "super_admin") {
    return NextResponse.json({ error: "Only administrators can resend invitations." }, { status: 403 });
  }
  const { id } = params;

  if (isRateLimited(`invite-resend:${me.id}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many resends recently — please wait a few minutes and try again." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }
  if (invitation.status === "accepted") {
    return NextResponse.json({ error: "This invitation has already been accepted." }, { status: 409 });
  }
  if (invitation.status === "revoked") {
    return NextResponse.json({ error: "This invitation was revoked — send a new one instead." }, { status: 409 });
  }

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = invitationExpiryDate();

  const { error: updateError } = await supabase
    .from("invitations")
    .update({
      token_hash: tokenHash,
      token_expires_at: expiresAt,
      status: "sent",
      last_resent_at: new Date().toISOString(),
      resend_count: (invitation.resend_count ?? 0) + 1,
    })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Could not resend that invitation." }, { status: 500 });
  }

  const acceptUrl = `${baseUrlFromRequest(request).replace(/\/$/, "")}/accept-invitation?token=${token}`;
  const expiresAtLabel = new Date(expiresAt).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
  const html =
    invitation.invited_role === "therapist"
      ? therapistInvitationEmail({ firstName: invitation.first_name, acceptUrl, expiresAtLabel })
      : administratorInvitationEmail({
          firstName: invitation.first_name,
          acceptUrl,
          expiresAtLabel,
          roleLabel: invitation.invited_role === "super_admin" ? "Super Admin" : "Administrator",
        });
  const subject =
    invitation.invited_role === "therapist" ? "You're invited to join GESA as a Professional" : "You're invited to join the GESA Admin Team";

  const sendResult = await sendEmailSafely({ to: invitation.email, subject, html });
  if (sendResult.error) {
    await supabase.from("invitations").update({ status: "failed" }).eq("id", id);
  }

  await logAdminAction(supabase, {
    adminId: me.email ?? me.id,
    action: sendResult.error ? "invitation.resend_failed" : "invitation.resent",
    targetType: "invitation",
    targetId: id,
    metadata: { email: invitation.email, invited_role: invitation.invited_role },
  });

  return NextResponse.json({ ok: true });
}
