import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 150 — support_requests has no RLS policies at all (service-role
// only, same fact noted in .../support-requests/status/route.ts), so this
// delete has to go through the admin client regardless; same auth check as
// every other delete route added this phase.
export async function DELETE(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "a valid id is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.from("support_requests").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "could not delete support request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
