import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 129 — "Cancel booking" from the review screen. Only ever touches a
// row that isn't already confirmed/cancelled — once confirmed, cancelling a
// diary-link "appointment" is meaningless from GESA's side anyway, since
// GESA never held a real reservation on the therapist's external calendar
// to release.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const eventId = body?.eventId as string | undefined;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("diary_scheduling_events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .in("status", ["calendar_opened", "slot_selected", "pending_confirmation", "failed"]);

  return NextResponse.json({ ok: true });
}
