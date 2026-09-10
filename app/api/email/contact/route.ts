import { NextResponse } from "next/server";
import { getContactInbox, getReplyTo, isValidEmailFormat, sendEmailSafely } from "@/lib/email/resend";
import { contactNotificationEmail, contactReceivedEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined) ?? "";
  const email = body?.email as string | undefined;
  const subject = (body?.subject as string | undefined) ?? "";
  const message = (body?.message as string | undefined) ?? "";

  if (!email || !message || !isValidEmailFormat(email)) {
    return NextResponse.json({ error: "A valid email and message are required" }, { status: 400 });
  }

  const [toSender, toTeam] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "We received your message",
      html: contactReceivedEmail(name, subject),
      replyTo: getContactInbox(),
    }),
    sendEmailSafely({
      to: getContactInbox(),
      subject: `New inquiry: ${subject || "General"}`,
      html: contactNotificationEmail(name, email, subject, message),
      replyTo: getReplyTo(email),
    }),
  ]);

  return NextResponse.json({ toSender, toTeam });
}
