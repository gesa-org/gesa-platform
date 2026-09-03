import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 129 — records what the client says they picked on the therapist's
// external diary-link calendar, after they return to the GESA tab (see
// components/booking/SlotSelectionModal.tsx). This is the "otherwise
// capture the selected slot" fallback for providers with no callback/
// webhook — every field this writes is client-reported, not verified
// against the therapist's real calendar. Writes go through the service-role
// client because diary_scheduling_events has no public UPDATE policy.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const eventId = body?.eventId as string | undefined;
  const selectedDate = body?.selectedDate as string | undefined;
  const selectedStartTime = body?.selectedStartTime as string | undefined;
  const selectedEndTime = (body?.selectedEndTime as string | undefined) || null;
  const durationMinutes = (body?.durationMinutes as number | undefined) ?? null;
  const timeZone = (body?.timeZone as string | undefined) || null;
  const appointmentType = (body?.appointmentType as string | undefined) || "online";

  if (!eventId || !selectedDate || !selectedStartTime) {
    return NextResponse.json({ error: "eventId, selectedDate, and selectedStartTime are required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (selectedDate < today) {
    return NextResponse.json({ error: "The date you entered is in the past — please double check it." }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: event, error: fetchError } = await adminSupabase
    .from("diary_scheduling_events")
    .select("id, status")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !event) {
    return NextResponse.json({ error: "We couldn't find that scheduling session — please start again." }, { status: 404 });
  }
  // "cancelled"/"confirmed" are terminal — everything else (calendar_opened,
  // slot_selected, pending_confirmation, failed) can still (re)report a
  // slot, e.g. the client used "Back to calendar" from the review screen to
  // change their answer.
  if (event.status === "confirmed" || event.status === "cancelled") {
    return NextResponse.json({ error: "This booking has already been finalized." }, { status: 409 });
  }

  const { error: updateError } = await adminSupabase
    .from("diary_scheduling_events")
    .update({
      selected_date: selectedDate,
      selected_start_time: selectedStartTime,
      selected_end_time: selectedEndTime,
      duration_minutes: durationMinutes,
      time_zone: timeZone,
      appointment_type: appointmentType,
      status: "slot_selected",
    })
    .eq("id", eventId);

  if (updateError) {
    return NextResponse.json({ error: "Could not save your selected time — please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
