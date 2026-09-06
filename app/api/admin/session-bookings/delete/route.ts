import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 150 — same server-authorized delete pattern used across every
// admin section this phase (see app/api/admin/inquiries/delete/route.ts).
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
  const { error } = await adminSupabase.from("session_bookings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "could not delete session booking" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
