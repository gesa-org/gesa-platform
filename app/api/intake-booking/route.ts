import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const city = (body?.city as string | undefined) ?? null;
  const birthYear = body?.birthYear as number | undefined;
  const agreedTerms = body?.agreedTerms === true;
  const agreedPrivacy = body?.agreedPrivacy === true;
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

  // Phase 54 — re-validate age and both consent checkboxes server-side too.
  // The modal already disables submit and blocks the request client-side
  // (components/intake/IntakeBookingModal.tsx), but that's only a UX
  // convenience — anyone could otherwise call this endpoint directly and
  // skip both checks, which matters here since one of them is a real legal
  // consent, not just a nice-to-have field.
  const currentYear = new Date().getFullYear();
  if (!birthYear || !Number.isInteger(birthYear) || birthYear < currentYear - 100 || birthYear > currentYear) {
    return NextResponse.json({ error: "a valid year of birth is required" }, { status: 400 });
  }
  if (birthYear > currentYear - 18) {
    return NextResponse.json({ error: "you must be at least 18 years old to book a session" }, { status: 400 });
  }
  if (!agreedTerms || !agreedPrivacy) {
    return NextResponse.json({ error: "agreement to the terms and the privacy policy is required" }, { status: 400 });
  }

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

  const consentTimestamp = new Date().toISOString();
  const { error: insertError } = await supabase.from("session_bookings").insert({
    therapist_id: therapistId,
    client_name: name,
    client_email: email,
    client_phone: phone,
    client_city: city,
    client_birth_year: birthYear,
    // Storing *when* consent was given, not just a boolean — both are
    // already guaranteed true by the validation above, so this is purely
    // about keeping a real timestamped compliance record.
    agreed_terms_at: consentTimestamp,
    agreed_privacy_at: consentTimestamp,
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

  // Phase 126 — this used the cookie-based `supabase` client (the `anon`
  // Postgres role for an unauthenticated booker, which is the normal case
  // here). Since contact_email/contact_phone had column-level SELECT
  // revoked from `anon` as part of locking down the public directory/
  // profile pages, that query would now silently return null for both
  // fields on every guest booking — quietly breaking the therapist's own
  // notification email and the post-booking WhatsApp link below. Switched
  // to the service-role admin client for this one lookup: it's server-only
  // code (never reaches the browser) doing a legitimate system operation
  // — looking up who to notify after a booking THIS SAME REQUEST just
  // created — not a client-facing read, so bypassing RLS/column grants
  // here is correct, not a hole.
  const adminSupabase = createAdminClient();
  let therapistContactEmail: string | null = null;
  let therapistContactPhone: string | null = null;
  const { data: therapist } = await adminSupabase
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
