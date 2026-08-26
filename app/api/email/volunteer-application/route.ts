import { NextResponse } from "next/server";
import { sendEmailSafely } from "@/lib/email/resend";
import { volunteerApplicationNotificationEmail, volunteerApplicationReceivedEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

// Phase 64 — the modal sends the raw MeetingDuration value ("60"/"45"/
// "30"/"anytime"); this route formats it for the human-readable admin
// notification email so that template doesn't need its own copy of the
// label mapping.
const MEETING_DURATION_LABELS: Record<string, string> = {
  "60": "60 min",
  "45": "45 min",
  "30": "30 min",
  anytime: "Anytime",
};

// Phase 63 — best-effort notification pair for the new volunteer therapist
// application flow, same pattern as /api/email/contact: the application
// itself is already saved to therapist_applications by the time this is
// called (see VolunteerApplicationModal), so a failure here never loses the
// application, only the confirmation/notification emails.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = (body?.fullName as string | undefined) ?? "";
  const email = body?.email as string | undefined;
  const phone = (body?.phone as string | undefined) ?? null;
  const credentialsProof = (body?.credentialsProof as string | undefined) ?? "";
  const specialties = Array.isArray(body?.specialties) ? (body.specialties as string[]) : [];
  const languages = Array.isArray(body?.languages) ? (body.languages as string[]) : [];
  const meetingDuration = (body?.meetingDuration as string | undefined) ?? "";
  const meetingDurationLabel = MEETING_DURATION_LABELS[meetingDuration] ?? meetingDuration;
  const bio = (body?.bio as string | undefined) ?? "";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const [toApplicant, toTeam] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "We received your volunteer therapist application",
      html: volunteerApplicationReceivedEmail(fullName),
    }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `New volunteer therapist application: ${fullName || email}`,
      html: volunteerApplicationNotificationEmail({
        fullName,
        email,
        phone,
        credentialsProof,
        specialties,
        languages,
        meetingDurationLabel,
        bio,
      }),
    }),
  ]);

  return NextResponse.json({ toApplicant, toTeam });
}
