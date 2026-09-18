import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContactInbox, getReplyTo } from "@/lib/email/resend";
import { sendTrackedEmail } from "@/lib/email/tracked";
import {
  diaryAppointmentClientConfirmationEmail,
  diaryAppointmentTeamNotificationEmail,
  diaryAppointmentTherapistNotificationEmail,
} from "@/lib/email/templates";

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

// Phase 129 — the terminal "Confirm schedule" step of the review screen
// (components/booking/ScheduleReviewModal.tsx). Validates that a therapist,
// a completed intake record, and a self-reported slot all exist before
// writing anything, then finalizes the diary_scheduling_events row as
// "confirmed" and sends the three notification emails.
//
// There is no real concept of "the slot became unavailable" here the way
// there is for the native session_bookings flow (a DB unique constraint
// actually reserves that slot) — nothing on GESA's side holds a real
// reservation against an external, uncontrolled diary link. This route's
// error handling is still shaped the same way (validate, fail clearly, let
// the client retry) so the pattern is ready to plug a real provider
// integration into later, but today the only realistic failure mode is a
// missing/stale event id, not a genuine double-booking.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const eventId = body?.eventId as string | undefined;

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const { data: event, error: fetchError } = await adminSupabase
    .from("diary_scheduling_events")
    .select(
      "id, therapist_id, status, selected_date, selected_start_time, selected_end_time, duration_minutes, time_zone, appointment_type, diary_link, intake_submission_id, service_type, payment_status"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !event) {
    return NextResponse.json({ error: "We couldn't find that scheduling session — please start again." }, { status: 404 });
  }
  if (event.status === "confirmed") {
    // Idempotent: clicking "Confirm schedule" twice (double-click, or a
    // retry after a network blip on a request that actually succeeded)
    // should not fail or send a second round of emails — just say yes.
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
  }
  if (event.status === "cancelled") {
    return NextResponse.json({ error: "This booking was cancelled and can't be confirmed." }, { status: 409 });
  }
  // Phase 235 — a diary-link handoff left unconfirmed for over an hour is
  // marked "expired" by the hourly public.expire_stale_submissions() cron
  // job. Per Roy's one-hour-expiry requirement, an expired attempt can never
  // be resumed/submitted from here — the client has to start the booking
  // over from the beginning (a fresh intake creates a fresh event id, so
  // there's no old data to accidentally resurrect).
  if (event.status === "expired") {
    return NextResponse.json(
      { error: "This booking session has expired after being inactive for over an hour — please start again." },
      { status: 410 }
    );
  }
  if (!event.selected_date || !event.selected_start_time) {
    return NextResponse.json({ error: "Please select a date and time before confirming." }, { status: 400 });
  }
  if (!event.intake_submission_id) {
    return NextResponse.json({ error: "Missing intake details — please start the booking again." }, { status: 400 });
  }
  // Phase 196 — the one real payment gate: a Professional Services booking
  // can only ever be confirmed once its own PayPal capture has actually
  // succeeded (see /api/payments/paypal/capture-order). Charity Services
  // and every pre-Phase-196 booking (service_type null) skip this entirely,
  // same as before.
  if (event.service_type === "professional" && event.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Payment hasn't been completed yet — please finish checkout before confirming." },
      { status: 402 }
    );
  }

  const { data: intake, error: intakeError } = await adminSupabase
    .from("booking_intake_forms")
    .select("id, client_name, client_email, client_phone, agreed_terms_at, agreed_privacy_at, therapist_name")
    .eq("id", event.intake_submission_id)
    .maybeSingle();

  if (intakeError || !intake || !intake.agreed_terms_at || !intake.agreed_privacy_at) {
    return NextResponse.json({ error: "Missing required consent — please start the booking again." }, { status: 400 });
  }

  const { data: therapist } = await adminSupabase
    .from("therapists")
    .select("full_name, contact_email")
    .eq("id", event.therapist_id)
    .maybeSingle();

  const confirmedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await adminSupabase
    .from("diary_scheduling_events")
    .update({
      status: "confirmed",
      confirmed_at: confirmedAt,
      client_name: intake.client_name,
      client_email: intake.client_email,
      client_phone: intake.client_phone,
    })
    .eq("id", eventId)
    .in("status", ["calendar_opened", "slot_selected", "pending_confirmation", "payment_pending", "failed"])
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Could not confirm your appointment — please try again." }, { status: 500 });
  }

  const referenceNumber = `GESA-${eventId.slice(0, 8).toUpperCase()}`;
  const therapistName = therapist?.full_name || intake.therapist_name;
  const formattedTime = formatTime(event.selected_start_time);

  const [toClient, toTherapist, toTeam] = await Promise.all([
    sendTrackedEmail({
      idempotencyKey: `diary-booking-confirmed:${eventId}:client`,
      templateType: "booking_confirmation",
      recipientRole: "client",
      recipientEmail: intake.client_email,
      relatedRecordType: "diary_scheduling_event",
      relatedRecordId: eventId,
      subject: "Your session has been scheduled",
      html: diaryAppointmentClientConfirmationEmail(
        intake.client_name,
        therapistName,
        event.selected_date,
        formattedTime,
        event.time_zone,
        referenceNumber
      ),
      replyTo: getContactInbox(),
    }),
    therapist?.contact_email
      ? sendTrackedEmail({
          idempotencyKey: `diary-booking-confirmed:${eventId}:therapist`,
          templateType: "therapist_booking_notification",
          recipientRole: "therapist",
          recipientEmail: therapist.contact_email,
          relatedRecordType: "diary_scheduling_event",
          relatedRecordId: eventId,
          subject: "A client confirmed a session with you",
          html: diaryAppointmentTherapistNotificationEmail(
            therapistName,
            intake.client_name,
            event.selected_date,
            formattedTime,
            event.time_zone
          ),
          replyTo: getReplyTo(intake.client_email),
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
    sendTrackedEmail({
      idempotencyKey: `diary-booking-confirmed:${eventId}:admin`,
      templateType: "admin_operational_notification",
      recipientRole: "admin",
      recipientEmail: getContactInbox(),
      relatedRecordType: "diary_scheduling_event",
      relatedRecordId: eventId,
      subject: `Diary-link session confirmed: ${therapistName}`,
      html: diaryAppointmentTeamNotificationEmail(
        therapistName,
        intake.client_name,
        intake.client_email,
        event.selected_date,
        formattedTime,
        referenceNumber
      ),
      replyTo: getReplyTo(intake.client_email),
    }),
  ]);

  return NextResponse.json({
    ok: true,
    referenceNumber,
    therapistName,
    selectedDate: event.selected_date,
    selectedStartTime: event.selected_start_time,
    selectedEndTime: event.selected_end_time,
    durationMinutes: event.duration_minutes,
    timeZone: event.time_zone,
    clientEmail: intake.client_email,
    toClient,
    toTherapist,
    toTeam,
  });
}
