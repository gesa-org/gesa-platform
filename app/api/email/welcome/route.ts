import { NextResponse } from "next/server";
import { sendEmailSafely } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;
  const fullName = (body?.fullName as string | undefined) ?? "";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const result = await sendEmailSafely({
    to: email,
    subject: "Welcome to GESA",
    html: welcomeEmail(fullName),
  });

  return NextResponse.json(result);
}
