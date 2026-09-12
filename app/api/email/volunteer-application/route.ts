import { NextResponse } from "next/server";
import { getContactInbox, getReplyTo, isValidEmailFormat, sendEmailSafely } from "@/lib/email/resend";
import { volunteerApplicationNotificationEmail, volunteerApplicationReceivedEmail } from "@/lib/email/templates";

// Phase 64 — the modal sends the raw meeting-duration value; this route
// formats the three fixed presets into a human-readable label for the
// admin notification email. Phase 65 — anything else (a volunteer's own
// "Specify time" free text, e.g. "2 hours") isn't in this map, so it falls
// through to the `?? meetingDuration` below and is shown exactly as typed.
const MEETING_DURATION_LABELS: Record<string, string> = {
  "90": "90 min",
  "60": "60 min",
  "45": "45 min",
  "30": "30 min",
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
  // Phase 189 — new fields from the rebuilt application form. All optional
  // here (best-effort notification, same as every field above) so a missing
  // one never blocks the email the way it would block the actual DB insert.
  const gender = (body?.gender as string | undefined) ?? null;
  const country = (body?.country as string | undefined) ?? null;
  const primaryExpertise = (body?.primaryExpertise as string | undefined) ?? null;
  const calendarLink = (body?.calendarLink as string | undefined) ?? null;
  const photoUrl = (body?.photoUrl as string | undefined) ?? null;

  if (!email || !isValidEmailFormat(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const [toApplicant, toTeam] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "We received your volunteer therapist application",
      html: volunteerApplicationReceivedEmail(fullName),
      replyTo: getContactInbox(),
    }),
    sendEmailSafely({
      to: getContactInbox(),
      subject: `New volunteer therapist application: ${fullName || email}`,
      html: volunteerApplicationNotificationEmail({
        fullName,
        email,
        phone,
        gender,
        country,
        credentialsProof,
        primaryExpertise,
        specialties,
        languages,
        meetingDurationLabel,
        calendarLink,
        photoUrl,
        bio,
      }),
      replyTo: getReplyTo(email),
    }),
  ]);

  return NextResponse.json({ toApplicant, toTeam });
}
