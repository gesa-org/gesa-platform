import { Resend } from "resend";

// Server-only. Throws if RESEND_API_KEY isn't set so callers can decide
// whether to treat a missing key as fatal or just log and move on — email
// delivery should never block the underlying database action (signup,
// contact form, group registration all succeed regardless of email status).
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "GESA <no-reply@gesa.org>";

export async function sendEmailSafely(params: { to: string; subject: string; html: string }) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${params.to}: "${params.subject}"`);
    return { skipped: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[email] Resend error", error);
      return { skipped: false, error };
    }
    return { skipped: false };
  } catch (err) {
    console.error("[email] send failed", err);
    return { skipped: false, error: err };
  }
}
