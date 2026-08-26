import { NextResponse } from "next/server";
import { sendEmailSafely } from "@/lib/email/resend";
import { volunteerApplicationNotificationEmail, volunteerApplicationReceivedEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

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
      html: volunteerApplicationNotificationEmail({ fullName, email, phone, credentialsProof, specialties, languages, bio }),
    }),
  ]);

  return NextResponse.json({ toApplicant, toTeam });
}
