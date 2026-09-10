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

// Phase 177 — the *sending* domain, kept separate from GESA_CONTACT_INBOX
// (the *receiving* inbox) below. This must stay a domain actually verified
// in Resend — Gmail cannot be used here (Resend/most providers reject
// sending "from" an address on a domain you haven't verified with them),
// so this intentionally does not change to gesa.org26@gmail.com even though
// the receiving inbox below does.
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "GESA <no-reply@gesa.org>";

// Phase 177 — every notification route used to define its own
// `process.env.GESA_CONTACT_INBOX || "hello@gesa.org"` constant.
// hello@gesa.org was never a real, monitored inbox, so any environment
// missing the env var silently sent every booking/inquiry/volunteer/
// donation notification into a black hole with no visible signal anywhere
// except a server log line. This is now the one place that decides where
// admin notifications go, and the one fallback value, so it can never drift
// out of sync between routes again — see EXECUTION_PLAN.md Phase 177.
const HEADER_INJECTION_PATTERN = /[\r\n]/;
// Deliberately simple, not a full RFC 5322 validator — this only needs to
// reject "obviously not an email" (missing @, no domain) and header
// injection (a value containing a newline could otherwise smuggle extra
// headers — Bcc, additional To, etc. — into an email sent through Resend's
// API if a raw form field were ever passed straight through as a `to` or
// `replyTo`), not accept every edge case a real address can legally have.
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function isValidEmailFormat(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || HEADER_INJECTION_PATTERN.test(trimmed)) return false;
  return EMAIL_PATTERN.test(trimmed);
}

// Temporary fallback ONLY — used solely when GESA_CONTACT_INBOX is missing
// or malformed, so a notification still lands somewhere Roy actually
// monitors instead of silently going nowhere (or to the old
// "hello@gesa.org" placeholder, which nobody reads). Set GESA_CONTACT_INBOX
// in every real environment (see ENV_VARS.md) rather than relying on this.
export const FALLBACK_CONTACT_INBOX = "gesa.org26@gmail.com";

// Logged at most once per server instance, not once per request/email —
// this can fire on every single notification otherwise (a busy day of
// bookings/inquiries would spam the log with the same warning repeatedly).
let warnedAboutContactInbox = false;

// The single source of truth for "where do admin notifications go" — every
// route that used to read `process.env.GESA_CONTACT_INBOX` directly should
// call this instead. Validates format (not just presence) so a typo'd or
// truncated env var doesn't quietly break delivery the same way a missing
// one did.
export function getContactInbox(): string {
  const configured = process.env.GESA_CONTACT_INBOX;
  if (isValidEmailFormat(configured)) return configured.trim();
  if (!warnedAboutContactInbox) {
    warnedAboutContactInbox = true;
    console.warn(
      configured
        ? `[email] GESA_CONTACT_INBOX ("${configured}") is not a valid email address — falling back to ${FALLBACK_CONTACT_INBOX}. Set a real monitored inbox in every environment (see ENV_VARS.md).`
        : `[email] GESA_CONTACT_INBOX is not set — falling back to ${FALLBACK_CONTACT_INBOX}. Set a real monitored inbox in every environment (see ENV_VARS.md).`
    );
  }
  return FALLBACK_CONTACT_INBOX;
}

// A visitor-submitted form should let a reply go straight back to the
// visitor, not to GESA's own inbox — falls back to the configured contact
// inbox if the visitor's address is missing or malformed, which also closes
// off header injection via a hostile "email" form field (isValidEmailFormat
// rejects anything containing a newline).
export function getReplyTo(visitorEmail?: string | null): string {
  return isValidEmailFormat(visitorEmail) ? visitorEmail.trim() : getContactInbox();
}

export async function sendEmailSafely(params: { to: string; subject: string; html: string; replyTo?: string }) {
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
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
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
