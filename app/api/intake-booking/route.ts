import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmailSafely } from "@/lib/email/resend";
import {
  sessionBookingConfirmationEmail,
  sessionBookingTeamNotificationEmail,
  sessionBookingTherapistNotificationEmail,
} from "@/lib/email/templates";
import type { ContactChannel } from "@/lib/database.types";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";
const CHANNEL_VALUES: ContactChannel[] = ["email", "whatsapp", "zoom"];

// Phase 20 — books an actual, conflict-free slot (as opposed to
// /api/booking and /api/match-booking, which only ever record a
// "preferred" time with no guarantee of availability). The
// UNIQUE(therapist_id, session_date, session_time) constraint on
// session_bookings is what actually prevents double-booking; the 23505
// catch below just turns that DB-level rejection into a friendly response
// instead of a generic 500, covering the rare race where two people request
// the same slot within the same second.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = (body?.name as string | undefined) ?? "";
  const email = (body?.email as string | undefined) ?? "";
  const phone = (body?.phone as string | undefined) ?? null;
  const therapistId = body?.therapistId as string | undefined;
  const therapistName = (body?.therapistName as string | undefined) ?? "your matched therapist";
  const sessionDate = body?.sessionDate as string | undefined;
  const sessionTime = body?.sessionTime as string | undefined;
  const contactChannelRaw = body?.contactChannel as string | undefined;
  const path = (body?.path as string | undefined) ?? null;

  if (!name || !email || !therapistId || !sessionDate || !sessionTime) {
    return NextResponse.json(
      { error: "name, email, therapistId, sessionDate, and sessionTime are required" },
      { status: 400 }
    );
  }
  if (!contactChannelRaw || !CHANNEL_VALUES.includes(contactChannelRaw as ContactChannel)) {
    return NextResponse.json({ error: "invalid contactChannel" }, { status: 400 });
  }
  const contactChannel = contactChannelRaw as ContactChannel;

  const supabase = await createClient();

  // Defense in depth: re-check the slot is still free right before inserting,
  // on top of the DB unique constraint that's the real guarantee.
  const { data: alreadyBooked } = await supabase.rpc("get_booked_slots", {
    p_therapist_id: therapistId,
    p_date: sessionDate,
  });
  if ((alreadyBooked ?? []).some((b) => b.session_time.slice(0, 5) === sessionTime)) {
    return NextResponse.json(
      { error: "That time was just booked by someone else — please pick another slot." },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase.from("session_bookings").insert({
    therapist_id: therapistId,
    client_name: name,
    client_email: email,
    client_phone: phone,
    session_date: sessionDate,
    session_time: sessionTime,
    contact_channel: contactChannel,
    path,
  });

  if (insertError) {
    // 23505 = unique_violation — someone else grabbed this exact slot in the race window.
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "That time was just booked by someone else — please pick another slot." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "could not save booking" }, { status: 500 });
  }

  let therapistContactEmail: string | null = null;
  let therapistContactPhone: string | null = null;
  const { data: therapist } = await supabase
    .from("therapists")
    .select("contact_email, contact_phone")
    .eq("id", therapistId)
    .maybeSingle();
  therapistContactEmail = therapist?.contact_email ?? null;
  therapistContactPhone = therapist?.contact_phone ?? null;

  const [toClient, toTeam, toTherapist] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "Your GESA session is booked",
      html: sessionBookingConfirmationEmail(name, therapistName, sessionDate, sessionTime, contactChannel),
    }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `New confirmed booking: ${name} with ${therapistName}`,
      html: sessionBookingTeamNotificationEmail(name, email, therapistName, sessionDate, sessionTime, contactChannel, path),
    }),
    therapistContactEmail
      ? sendEmailSafely({
          to: therapistContactEmail,
          subject: `New session booked: ${name}`,
          html: sessionBookingTherapistNotificationEmail(therapistName, name, email, sessionDate, sessionTime, contactChannel),
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
  ]);

  return NextResponse.json({
    toClient,
    toTeam,
    toTherapist,
    therapistContactPhone: contactChannel === "whatsapp" ? therapistContactPhone : null,
  });
}
