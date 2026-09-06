import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportRequestStatus } from "@/lib/database.types";

const STATUSES: SupportRequestStatus[] = [
  "started",
  "preferences_submitted",
  "matched",
  "no_match",
  "therapist_selected",
  "booking_requested",
  "scheduled",
  "completed",
  "cancelled",
  "redirected_manual",
];

// Phase 142 — support_requests has no RLS policies at all (service-role
// only), so the browser-client-write pattern MatchRequestStatusSelect uses
// (relying on an admin RLS policy) doesn't apply here. This route re-checks
// admin status itself via getCurrentProfile() (reads the caller's own
// session — not requireAdmin(), which is written for Server
// Components/pages and redirects rather than returning a value, wrong for
// an API route) before writing through the admin client.
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const status = body?.status as string | undefined;

  if (!id || !status || !STATUSES.includes(status as SupportRequestStatus)) {
    return NextResponse.json({ error: "a valid id and status are required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("support_requests")
    .update({ status: status as SupportRequestStatus })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "could not update status" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
