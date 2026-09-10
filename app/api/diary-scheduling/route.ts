import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContactInbox, getReplyTo, sendEmailSafely } from "@/lib/email/resend";
import { diarySchedulingTeamNotificationEmail, diarySchedulingTherapistNotificationEmail } from "@/lib/email/templates";

// Phase 126 — records a client being sent to a therapist's own diary-link
// scheduling page (see BookSessionButton.tsx), and notifies the therapist +
// admin that this happened. This is intentionally the *only* thing this
// route does: none of the diary providers we support (Google Calendar
// appointment schedules, Calendly, simplybook.it) call back into this app
// when the client actually finishes booking a slot, so there is no way to
// know from here whether a session was really scheduled from this event
// alone. Phase 129 adds a self-report step after this (see
// /api/diary-appointment/select-slot and /api/diary-appointment/confirm) —
// this route only ever creates the row with status "calendar_opened".
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const therapistId = body?.therapistId as string | undefined;
  const diaryLink = body?.diaryLink as string | undefined;
  const clientName = (body?.clientName as string | undefined)?.trim() || null;
  const clientEmail = (body?.clientEmail as string | undefined)?.trim() || null;
  const clientPhone = (body?.clientPhone as string | undefined)?.trim() || null;
  const timeZone = (body?.timeZone as string | undefined) || null;
  const therapistName = (body?.therapistName as string | undefined) || "your matched therapist";
  // Phase 128 — set when this handoff follows the new intake step (see
  // /api/booking-intake and BookSessionButton.tsx). Links this event back
  // to that submission, and flips its status from "intake_completed" to
  // "diary_opened" so the intake record's own status reflects how far the
  // booking flow actually got, not just that a form was filled in.
  const intakeSubmissionId = (body?.intakeSubmissionId as string | undefined) || null;
  // Phase 142 — set only when this handoff comes from the AI Support
  // results screen (see BookSessionButton's supportRequestId prop). Links
  // this event back to that client's support_requests row and advances its
  // status, mirroring the intakeSubmissionId handling just above.
  const supportRequestId = (body?.supportRequestId as string | undefined) || null;
  // Phase 151 — same booking-source tracking added to /api/intake-booking;
  // this table never had a `path`/source column at all before this phase
  // (see the add_browse_search_metadata_to_bookings migration), so all 4 of
  // these are null except when this handoff comes from Browse Therapist
  // search (see BookSessionButton's bookingMetadata prop).
  const path = (body?.path as string | undefined) || null;
  const searchSessionType = (body?.searchSessionType as string | undefined) || null;
  const searchCountry = (body?.searchCountry as string | undefined) || null;
  const searchCityOrAddress = (body?.searchCityOrAddress as string | undefined) || null;

  if (!therapistId || !diaryLink) {
    return NextResponse.json({ error: "therapistId and diaryLink are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: inserted, error: insertError } = await supabase
    .from("diary_scheduling_events")
    .insert({
      therapist_id: therapistId,
      diary_link: diaryLink,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      time_zone: timeZone,
      intake_submission_id: intakeSubmissionId,
      path,
      search_session_type: searchSessionType,
      search_country: searchCountry,
      search_city_or_address: searchCityOrAddress,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: "could not record scheduling event" }, { status: 500 });
  }

  // Same anon-column-revoke reasoning as the other booking routes: this is
  // a server-only lookup to notify the therapist about a handoff this same
  // request just recorded, not a client-facing read.
  const adminSupabase = createAdminClient();

  if (intakeSubmissionId) {
    // booking_intake_forms has no public UPDATE policy at all (see the
    // create_booking_intake_forms migration) — this admin-client write is
    // the one sanctioned path, and only ever advances status forward
    // (intake_completed -> diary_opened), never the reverse.
    await adminSupabase
      .from("booking_intake_forms")
      .update({ status: "diary_opened" })
      .eq("id", intakeSubmissionId)
      .eq("status", "intake_completed");
  }

  if (supportRequestId && inserted?.id) {
    await adminSupabase
      .from("support_requests")
      .update({ status: "scheduled", diary_scheduling_event_id: inserted.id })
      .eq("id", supportRequestId);
  }

  const { data: therapist } = await adminSupabase
    .from("therapists")
    .select("contact_email")
    .eq("id", therapistId)
    .maybeSingle();
  const therapistContactEmail = therapist?.contact_email ?? null;

  const [toTherapist, toTeam] = await Promise.all([
    therapistContactEmail
      ? sendEmailSafely({
          to: therapistContactEmail,
          subject: "Someone just opened your scheduling link",
          html: diarySchedulingTherapistNotificationEmail(therapistName, clientName),
          replyTo: getReplyTo(clientEmail),
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
    sendEmailSafely({
      to: getContactInbox(),
      subject: `Diary-link scheduling opened: ${therapistName}`,
      html: diarySchedulingTeamNotificationEmail(therapistName, clientName, clientEmail),
      replyTo: getReplyTo(clientEmail),
    }),
  ]);

  return NextResponse.json({ id: inserted?.id ?? null, status: "calendar_opened", toTherapist, toTeam });
}
