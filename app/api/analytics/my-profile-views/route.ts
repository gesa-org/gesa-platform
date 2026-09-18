import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// The public profile query deliberately never includes profile_views. This
// endpoint is the only browser-facing read for that metric and verifies the
// authenticated profile owns the linked professional row before returning it.
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "therapist") {
    return NextResponse.json({}, { headers: { "Cache-Control": "private, no-store" } });
  }

  const admin = createAdminClient();
  const { data: professional } = await admin
    .from("therapists")
    .select("id, profile_views")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({}, { headers: { "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json(
    { therapistId: professional.id, profileViews: professional.profile_views },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
