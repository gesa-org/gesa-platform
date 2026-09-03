import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSafely } from "@/lib/email/resend";
import { diarySchedulingTeamNotificationEmail, diarySchedulingTherapistNotificationEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

// Phase 126 — records a client being sent to a therapist's own diary-link
// scheduling page (see BookSessionButton.tsx), and notifies the therapist +
// admin that this happened. This is intentionally the *only* thing this
// route does: none of the diary providers we support (Google Calendar
// appointment schedules, Calendly, simplybook.it) call back into this app
// when the client actually finishes booking a slot, so there is no way to
// know from here whether a session was really scheduled — only that the
// client was handed off. Status is always "opened", never "confirmed";
// saying anything stronger would be a straightforwardly false claim in a
// booking-status email.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const therapistId = body?.therapistId as string | undefined;
  const diaryLink = body?.diaryLink as string | undefined;
  const clientName = (body?.clientName as string | undefined)?.trim() || null;
  const clientEmail = (body?.clientEmail as string | undefined)?.trim() || null;
  const clientPhone = (body?.clientPhone as string | undefined)?.trim() || null;
  const timeZone = (body?.timeZone as string | undefined) || null;
  const therapistName = (body?.therapistName as string | undefined) || "your matched therapist";

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
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `Diary-link scheduling opened: ${therapistName}`,
      html: diarySchedulingTeamNotificationEmail(therapistName, clientName, clientEmail),
    }),
  ]);

  return NextResponse.json({ id: inserted?.id ?? null, status: "opened", toTherapist, toTeam });
}
