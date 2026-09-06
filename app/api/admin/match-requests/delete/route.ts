import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 150 — this table (match_requests) backs the "Find Your Therapist
// (legacy)" page, which Phase 150 unlinked from the admin sidebar (see
// app/admin/layout.tsx) since it's superseded by support_requests/"Find
// Support requests" — but the page/route itself is left in place, still
// reachable by direct URL, for audit/history per this project's no-delete-
// data convention. It's still "retained" in that sense, so it still gets a
// real delete action like every other section, same server-authorized
// pattern as the rest.
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
  const { error } = await adminSupabase.from("match_requests").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "could not delete match request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
