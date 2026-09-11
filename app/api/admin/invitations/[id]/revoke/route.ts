import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/adminAuditLog";

// Phase 187 — "Revoke invitation." Immediately makes the current token
// unusable (accept-invitation checks status, not just expiry) without
// touching whatever it was going to link to (therapist_profile_id /
// volunteer_application_id stay put) — an admin can always issue a fresh
// invitation for the same person later.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin" && me.role !== "super_admin") {
    return NextResponse.json({ error: "Only administrators can revoke invitations." }, { status: 403 });
  }
  const { id } = params;

  const supabase = await createClient();
  const { data: invitation, error: fetchError } = await supabase.from("invitations").select("id, status, email, invited_role").eq("id", id).maybeSingle();
  if (fetchError || !invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }
  if (invitation.status === "accepted") {
    return NextResponse.json({ error: "This invitation has already been accepted and can't be revoked." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by_user_id: me.id })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Could not revoke that invitation." }, { status: 500 });
  }

  await logAdminAction(supabase, {
    adminId: me.email ?? me.id,
    action: "invitation.revoked",
    targetType: "invitation",
    targetId: id,
    metadata: { email: invitation.email, invited_role: invitation.invited_role },
  });

  return NextResponse.json({ ok: true });
}
