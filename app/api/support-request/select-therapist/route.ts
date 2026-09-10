import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContactInbox, getReplyTo, sendEmailSafely } from "@/lib/email/resend";
import { supportRequestTherapistNotificationEmail, supportRequestTeamNotificationEmail } from "@/lib/email/templates";

const FORMAT_LABEL: Record<string, string> = {
  online: "Online (video)",
  call: "Call",
  in_person: "In-Person",
};

// Phase 142 — called the moment a client opens either booking path
// (diary-link or native, via BookSessionButton's onFirstInteract) for a
// therapist on the AI Support results screen. Records the selection on the
// client's support_requests row and sends a minimal-info notification to
// the therapist and team — deliberately never including the client's
// feelings_text (see EXECUTION_PLAN.md Phase 142 + this table's column
// comment). The actual scheduling itself still goes through the same
// diary-scheduling / intake-booking routes every other entry point on the
// site uses — this route only records that a selection happened.
//
// Phase 143 — the wizard's old "Your Info" step was removed; contact
// details are now collected on the Matches step itself and only exist at
// this exact moment (this is the first time this route sees them — the
// support_requests row has none saved yet), so this route now also saves
// full_name/email/phone/consent_at here alongside the selection, instead of
// reading them back from a row that was never given them earlier.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const supportRequestId = body?.supportRequestId as string | undefined;
  const therapistId = body?.therapistId as string | undefined;
  const therapistName = (body?.therapistName as string | undefined) || "your matched therapist";
  const fullName = (body?.fullName as string | undefined)?.trim() || null;
  const email = (body?.email as string | undefined)?.trim() || null;
  const phone = (body?.phone as string | undefined)?.trim() || null;
  const agreedConsent = body?.agreedConsent === true;

  if (!therapistId) {
    return NextResponse.json({ error: "therapistId is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const clientName = fullName || "A GESA client";
  const clientEmail = email;

  let treatmentType: string | null = null;
  let sessionFormat: string | null = null;

  if (supportRequestId) {
    const { data: existing } = await adminSupabase
      .from("support_requests")
      .select("treatment_type, session_format")
      .eq("id", supportRequestId)
      .maybeSingle();
    if (existing) {
      treatmentType = existing.treatment_type;
      sessionFormat = existing.session_format;
    }

    await adminSupabase
      .from("support_requests")
      .update({
        selected_therapist_id: therapistId,
        status: "therapist_selected",
        full_name: fullName,
        email,
        phone,
        consent_at: agreedConsent ? new Date().toISOString() : null,
      })
      .eq("id", supportRequestId);
  }

  const { data: therapist } = await adminSupabase
    .from("therapists")
    .select("contact_email")
    .eq("id", therapistId)
    .maybeSingle();
  const therapistContactEmail = therapist?.contact_email ?? null;

  const formatLabel = sessionFormat ? FORMAT_LABEL[sessionFormat] ?? sessionFormat : null;

  const [toTherapist, toTeam] = await Promise.all([
    therapistContactEmail
      ? sendEmailSafely({
          to: therapistContactEmail,
          subject: `New client match: ${clientName}`,
          html: supportRequestTherapistNotificationEmail(therapistName, clientName, treatmentType, formatLabel),
          replyTo: getReplyTo(clientEmail),
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
    sendEmailSafely({
      to: getContactInbox(),
      subject: `AI Support: therapist selected — ${therapistName}`,
      html: supportRequestTeamNotificationEmail(clientName, clientEmail ?? "no email on file", therapistName),
      replyTo: getReplyTo(clientEmail),
    }),
  ]);

  return NextResponse.json({ ok: true, toTherapist, toTeam });
}
