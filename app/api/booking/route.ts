import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSafely } from "@/lib/email/resend";
import {
  bookingConfirmationEmail,
  bookingTeamNotificationEmail,
  therapistNewMatchEmail,
} from "@/lib/email/templates";

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

  // Look up the matched therapist's contact_email server-side rather than
  // trusting anything the client sent — most of the 145 real therapists
  // don't have a linked Supabase Auth login yet, so this plain email column
  // (added in Phase 8) is the only reliable way to reach them directly.
  //
  // Phase 126 — switched from the cookie-based `supabase` client (anon role
  // for this public request, now revoked SELECT on contact_email/
  // contact_phone) to the service-role admin client. Same rationale as the
  // identical fix in /api/intake-booking and /api/match-booking: this is a
  // server-only notification lookup, not a client-facing read.
  let therapistContactEmail: string | null = null;
  if (matchedTherapistId) {
    const adminSupabase = createAdminClient();
    const { data: therapist } = await adminSupabase
      .from("therapists")
      .select("contact_email")
      .eq("id", matchedTherapistId)
      .maybeSingle();
    therapistContactEmail = therapist?.contact_email ?? null;
  }

  const [toSender, toTeam, toTherapist] = await Promise.all([
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
    therapistContactEmail
      ? sendEmailSafely({
          to: therapistContactEmail,
          subject: `New client match: ${name}`,
          html: therapistNewMatchEmail(matchedTherapistName, name, email, label),
        })
      : Promise.resolve({ skipped: true, reason: "no contact_email on file" }),
  ]);

  return NextResponse.json({ toSender, toTeam, toTherapist });
}
