import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSafely } from "@/lib/email/resend";
import { supportRequestTherapistNotificationEmail, supportRequestTeamNotificationEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

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
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const supportRequestId = body?.supportRequestId as string | undefined;
  const therapistId = body?.therapistId as string | undefined;
  const therapistName = (body?.therapistName as string | undefined) || "your matched therapist";

  if (!therapistId) {
    return NextResponse.json({ error: "therapistId is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  let clientName = "A GESA client";
  let clientEmail: string | null = null;
  let treatmentType: string | null = null;
  let sessionFormat: string | null = null;

  if (supportRequestId) {
    const { data: existing } = await adminSupabase
      .from("support_requests")
      .select("full_name, email, treatment_type, session_format")
      .eq("id", supportRequestId)
      .maybeSingle();
    if (existing) {
      clientName = existing.full_name || clientName;
      clientEmail = existing.email;
      treatmentType = existing.treatment_type;
      sessionFormat = existing.session_format;
    }

    await adminSupabase
      .from("support_requests")
      .update({ selected_therapist_id: therapistId, status: "therapist_selected" })
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
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `AI Support: therapist selected — ${therapistName}`,
      html: supportRequestTeamNotificationEmail(clientName, clientEmail ?? "no email on file", therapistName),
    }),
  ]);

  return NextResponse.json({ ok: true, toTherapist, toTeam });
}
