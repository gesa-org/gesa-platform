import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSafely } from "@/lib/email/resend";
import { matchConfirmationEmail, matchTeamNotificationEmail, therapistNewMatchEmail } from "@/lib/email/templates";
import type { GenderPreference, SessionFormat } from "@/lib/database.types";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";
const GENDER_VALUES: GenderPreference[] = ["woman", "man", "nonbinary", "no_preference"];
const FORMAT_VALUES: SessionFormat[] = ["online", "call", "in_person"];

const ENTRY_ROUTE_LABELS: Record<string, string> = {
  online: "Online (video)",
  call: "Call",
  in_person: "In-Person",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = (body?.name as string | undefined) ?? "";
  const email = (body?.email as string | undefined) ?? "";
  const phone = (body?.phone as string | undefined) ?? null;
  const symptoms = Array.isArray(body?.symptoms) ? (body.symptoms as string[]).filter(Boolean) : [];
  const treatmentType = (body?.treatmentType as string | undefined) ?? null;
  const genderPreferenceRaw = (body?.genderPreference as string | undefined) ?? "no_preference";
  const sessionFormatRaw = body?.sessionFormat as string | undefined;
  const clinicLocationId = (body?.clinicLocationId as string | undefined) ?? null;
  const preferredDate = (body?.preferredDate as string | undefined) ?? null;
  const preferredTime = (body?.preferredTime as string | undefined) ?? null;
  const selectedTherapistId = body?.selectedTherapistId as string | undefined;
  const selectedTherapistName = (body?.selectedTherapistName as string | undefined) ?? "your matched therapist";

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }
  if (!sessionFormatRaw || !FORMAT_VALUES.includes(sessionFormatRaw as SessionFormat)) {
    return NextResponse.json({ error: "invalid sessionFormat" }, { status: 400 });
  }
  const sessionFormat = sessionFormatRaw as SessionFormat;
  const genderPreference: GenderPreference = GENDER_VALUES.includes(genderPreferenceRaw as GenderPreference)
    ? (genderPreferenceRaw as GenderPreference)
    : "no_preference";

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("match_requests").insert({
    name,
    email,
    phone,
    symptoms,
    treatment_type: treatmentType,
    gender_preference: genderPreference,
    session_format: sessionFormat,
    clinic_location_id: sessionFormat === "in_person" ? clinicLocationId : null,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    selected_therapist_id: selectedTherapistId ?? null,
    matched_therapist_ids: selectedTherapistId ? [selectedTherapistId] : [],
  });

  if (insertError) {
    return NextResponse.json({ error: "could not save match request" }, { status: 500 });
  }

  // Phase 126 — same issue and fix as /api/intake-booking: the cookie-based
  // `supabase` client runs as `anon` for this public wizard, and
  // contact_email/contact_phone had column-level SELECT revoked from `anon`.
  // Using the service-role admin client here is a legitimate server-only
  // lookup (notifying the therapist about a booking this same request just
  // created), not a client-facing read.
  let therapistContactEmail: string | null = null;
  let therapistContactPhone: string | null = null;
  if (selectedTherapistId) {
    const adminSupabase = createAdminClient();
    const { data: therapist } = await adminSupabase
      .from("therapists")
      .select("contact_email, contact_phone")
      .eq("id", selectedTherapistId)
      .maybeSingle();
    therapistContactEmail = therapist?.contact_email ?? null;
    therapistContactPhone = therapist?.contact_phone ?? null;
  }

  const label = ENTRY_ROUTE_LABELS[sessionFormat] ?? sessionFormat;

  const [toClient, toTeam, toTherapist] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "You're matched with a GESA therapist",
      html: matchConfirmationEmail(name, selectedTherapistName, sessionFormat, preferredDate, preferredTime),
    }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `New AI-matched request: ${label} with ${selectedTherapistName}`,
      html: matchTeamNotificationEmail(
        name,
        email,
        selectedTherapistName,
        sessionFormat,
        symptoms,
        treatmentType,
        preferredDate,
        preferredTime
      ),
    }),
    therapistContactEmail
      ? sendEmailSafely({
          to: therapistContactEmail,
          subject: `New client match: ${name}`,
          html: therapistNewMatchEmail(selectedTherapistName, name, email, label),
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
  ]);

  return NextResponse.json({
    toClient,
    toTeam,
    toTherapist,
    // Only handed back to the browser when the client actually needs it for
    // a WhatsApp deep link (a "call" session format), and only after a real
    // match request row has been saved — never earlier, never for every
    // visitor (mirrors /api/intake-booking's therapistContactPhone field).
    therapistContactPhone: sessionFormat === "call" ? therapistContactPhone : null,
  });
}
