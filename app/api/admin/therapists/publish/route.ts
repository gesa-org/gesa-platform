import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/adminAuditLog";

// Phase 186 — the explicit "Publish / Set Active" action the spec requires
// to be a deliberate, separate step from creating a draft profile. Also
// used by the Danger Zone's plain reactivate/deactivate toggle on the edit
// page and the Our Professionals list's bulk activate action — same one
// endpoint for every "change a therapist's profile_status" caller, so the
// audit log and the admin-only check live in exactly one place. `nextStatus`
// accepts the full lifecycle, not just "active", since Draft/Pending
// publication/Inactive/Archived all go through this same status field (see
// TherapistRow.profile_status) — "archive" specifically still has its own
// dedicated route (app/api/admin/therapists/archive/route.ts) because that
// one has the extra linked-account branch the spec calls for.
const VALID_STATUSES = ["draft", "pending_publication", "active", "inactive"] as const;

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can publish or change a professional's status." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const nextStatus = body?.status as string | undefined;
  if (!id || !nextStatus || !VALID_STATUSES.includes(nextStatus as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "id and a valid status are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("therapists")
    .update({ profile_status: nextStatus, is_active: nextStatus === "active" })
    .eq("id", id)
    .select("id, full_name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not update that professional's status." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Professional not found." }, { status: 404 });
  }

  await logAdminAction(supabase, {
    adminId: me.email ?? me.id,
    action: nextStatus === "active" ? "therapist.publish" : "therapist.set_status",
    targetType: "therapist",
    targetId: id,
    metadata: { name: data.full_name, status: nextStatus },
  });

  return NextResponse.json({ ok: true });
}
