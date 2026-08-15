import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmailSafely } from "@/lib/email/resend";
import { bookingConfirmationEmail, bookingTeamNotificationEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

const ENTRY_ROUTE_LABELS: Record<string, string> = {
  crisis: "In crisis right now",
  veteran_reservist_family: "Veterans, reservists & families",
  seeking_help: "Seeking support",
  helpers: "Helping the helpers",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const entryRoute = (body?.entryRoute as string | undefined) ?? "";
  const name = (body?.name as string | undefined) ?? "";
  const email = body?.email as string | undefined;
  const matchedTherapistId = body?.matchedTherapistId as string | undefined;
  const matchedTherapistName = (body?.matchedTherapistName as string | undefined) ?? "your matched therapist";

  if (!Object.keys(ENTRY_ROUTE_LABELS).includes(entryRoute)) {
    return NextResponse.json({ error: "invalid entryRoute" }, { status: 400 });
  }
  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("booking_requests").insert({
    entry_route: entryRoute,
    name,
    email,
    matched_therapist_id: matchedTherapistId ?? null,
  });

  if (insertError) {
    return NextResponse.json({ error: "could not save booking request" }, { status: 500 });
  }

  const label = ENTRY_ROUTE_LABELS[entryRoute];
  const [toSender, toTeam] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "You're matched with a GESA therapist",
      html: bookingConfirmationEmail(name, matchedTherapistName),
    }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `New booking request: ${label}`,
      html: bookingTeamNotificationEmail(label, name, email, matchedTherapistName),
    }),
  ]);

  return NextResponse.json({ toSender, toTeam });
}
