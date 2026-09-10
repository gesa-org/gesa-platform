import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/adminAuditLog";

// Phase 186 — backs the "Delete" action in CRM > Our Professionals. Named
// "archive", not "delete", because it is one: per the spec's "prefer soft
// delete / archive where possible rather than irreversible database
// deletion", this never runs a SQL DELETE. It sets profile_status to
// "archived" (the trigger mirrors is_active := false from that, so the
// profile disappears from the public directory immediately — same
// mechanism as any other status change) and leaves every row — the
// therapist itself, its bookings, sessions, the volunteer application it
// may be linked to, any invitation — untouched. Only an admin (not
// reviewer) may call this, both here and at the DB trigger level.
//
// `mode` mirrors the three-way choice the spec's confirmation modal offers
// when the profile has a linked account:
//  - "archive_only": just the profile_status change.
//  - "archive_and_deactivate_account": the same change, plus banning the
//    linked auth user (not deleting it — reversible from the Supabase
//    dashboard, matches this codebase's existing "deactivate, don't
//    destroy" convention for user accounts) and unlinking profile_id so a
//    banned account can't still resolve to this profile anywhere.
export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can archive a professional profile." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const mode = (body?.mode as string | undefined) ?? "archive_only";
  const reason = (body?.reason as string | undefined)?.trim() || null;
  if (!id || (mode !== "archive_only" && mode !== "archive_and_deactivate_account")) {
    return NextResponse.json({ error: "id and a valid mode are required." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: therapist, error: fetchError } = await supabase
    .from("therapists")
    .select("id, full_name, profile_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) {
    return NextResponse.json({ error: "Could not load that professional." }, { status: 500 });
  }
  if (!therapist) {
    return NextResponse.json({ error: "Professional not found." }, { status: 404 });
  }

  const linkedProfileId = therapist.profile_id;

  const { error: archiveError } = await supabase
    .from("therapists")
    .update({
      profile_status: "archived",
      is_active: false,
      // Unlinking here, not just on the deactivate-account branch, so an
      // archived profile is never left pointing at a still-active login —
      // "archive_only" with a linked account still means "this account can
      // no longer act as this (now archived) professional."
      profile_id: mode === "archive_and_deactivate_account" ? null : linkedProfileId,
    })
    .eq("id", id);
  if (archiveError) {
    return NextResponse.json({ error: "Could not archive that professional." }, { status: 500 });
  }

  let accountDeactivated = false;
  if (mode === "archive_and_deactivate_account" && linkedProfileId) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            "Profile archived, but the linked account could not be deactivated — server is missing SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }
    const admin = createAdminClient();
    // A very long ban rather than deleting the auth user — reversible by an
    // admin later (via the Supabase dashboard) if this was done in error,
    // matching this codebase's existing preference for deactivation over
    // destruction (see e.g. the therapist "Deactivate" action itself).
    const { error: banError } = await admin.auth.admin.updateUserById(linkedProfileId, { ban_duration: "876000h" });
    accountDeactivated = !banError;
    if (banError) {
      await logAdminAction(supabase, {
        adminId: me.email ?? me.id,
        action: "therapist.archive_account_deactivate_failed",
        targetType: "therapist",
        targetId: id,
        metadata: { name: therapist.full_name, profile_id: linkedProfileId, error: banError.message },
      });
    }
  }

  await logAdminAction(supabase, {
    adminId: me.email ?? me.id,
    action: mode === "archive_and_deactivate_account" ? "therapist.archive_and_deactivate_account" : "therapist.archive",
    targetType: "therapist",
    targetId: id,
    metadata: { name: therapist.full_name, reason, accountDeactivated: mode === "archive_and_deactivate_account" ? accountDeactivated : undefined },
  });

  return NextResponse.json({ ok: true, accountDeactivated });
}
