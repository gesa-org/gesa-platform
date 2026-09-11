import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/adminAuditLog";

// Phase 187 — "Deactivate an administrator account without deleting audit
// history." Bans the linked auth user (same reversible ban_duration pattern
// as the therapist archive route from Phase 186) rather than deleting
// anything — the profiles row, its role, and every audit-log entry
// referencing them stay exactly as they were, and "Reactivate" (mode:
// "reactivate") lifts the ban with no other change.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin" && me.role !== "super_admin") {
    return NextResponse.json({ error: "Only administrators can manage other administrators." }, { status: 403 });
  }
  const { id } = params;
  const body = await request.json().catch(() => null);
  const mode = body?.mode === "reactivate" ? "reactivate" : "deactivate";

  if (id === me.id) {
    return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: target, error: fetchError } = await supabase.from("profiles").select("id, email, role").eq("id", id).maybeSingle();
  if (fetchError || !target) {
    return NextResponse.json({ error: "Administrator not found." }, { status: 404 });
  }
  if (target.role !== "admin" && target.role !== "super_admin") {
    return NextResponse.json({ error: "That account isn't an administrator." }, { status: 400 });
  }
  if (target.role === "super_admin" && me.role !== "super_admin") {
    return NextResponse.json({ error: "Only a Super Admin can deactivate another Super Admin." }, { status: 403 });
  }

  if (mode === "deactivate" && target.role === "super_admin") {
    // Same invariant as the DB trigger that protects a role *change* — a
    // ban has the same practical effect (they can no longer sign in), so it
    // gets the same protection even though the trigger itself only watches
    // the `role` column.
    const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "Cannot deactivate the last active Super Admin." }, { status: 409 });
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server is missing SUPABASE_SERVICE_ROLE_KEY — add it, then retry." }, { status: 500 });
  }
  const admin = createAdminClient();
  const { error: banError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: mode === "deactivate" ? "876000h" : "none",
  });
  if (banError) {
    return NextResponse.json({ error: "Could not update that account — try again." }, { status: 500 });
  }

  await logAdminAction(supabase, {
    adminId: me.email ?? me.id,
    action: mode === "deactivate" ? "administrator.deactivated" : "administrator.reactivated",
    targetType: "profile",
    targetId: id,
    metadata: { email: target.email, role: target.role },
  });

  return NextResponse.json({ ok: true });
}
