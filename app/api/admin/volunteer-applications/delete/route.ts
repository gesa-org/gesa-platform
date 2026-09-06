import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 150 — table is therapist_applications (the "Volunteer
// Applications" admin page's actual data source); same server-authorized
// delete pattern as every other section this phase.
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
  const { error } = await adminSupabase.from("therapist_applications").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "could not delete volunteer application" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
