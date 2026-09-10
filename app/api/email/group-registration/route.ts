import { NextResponse } from "next/server";
import { getContactInbox, isValidEmailFormat, sendEmailSafely } from "@/lib/email/resend";
import { groupRegistrationEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined) ?? "";
  const email = body?.email as string | undefined;
  const groupTitle = (body?.groupTitle as string | undefined) ?? "your group";
  const schedule = (body?.schedule as string | undefined) ?? "";

  if (!email || !isValidEmailFormat(email)) {
    return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
  }

  const result = await sendEmailSafely({
    to: email,
    subject: `You're registered for ${groupTitle}`,
    html: groupRegistrationEmail(name, groupTitle, schedule),
    replyTo: getContactInbox(),
  });

  return NextResponse.json(result);
}
