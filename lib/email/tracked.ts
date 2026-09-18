import { createAdminClient } from "@/lib/supabase/admin";
import { htmlToPlainText, isValidEmailFormat, sendEmailSafely } from "@/lib/email/resend";
import type { EmailRecipientRole, Json } from "@/lib/database.types";

export type TransactionalEmailTemplate =
  | "booking_confirmation"
  | "therapist_booking_notification"
  | "booking_update_client"
  | "booking_update_therapist"
  | "booking_cancellation_client"
  | "booking_cancellation_therapist"
  | "therapist_invitation"
  | "therapist_invitation_accepted"
  | "admin_operational_notification";

export type TrackedEmailInput = {
  idempotencyKey: string;
  templateType: TransactionalEmailTemplate;
  recipientRole: EmailRecipientRole;
  recipientEmail: string;
  relatedRecordType: string;
  relatedRecordId: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  metadata?: Json;
};

export type TrackedEmailResult = {
  sent: boolean;
  skipped: boolean;
  duplicate?: boolean;
  trackingUnavailable?: boolean;
  error?: "invalid_recipient" | "provider_rejected" | "provider_unavailable";
};

// This wrapper is intentionally called only after the business transaction
// has committed. The unique key claims the send before contacting Resend, so
// double clicks, retries, and duplicate backend events cannot create a
// second delivery attempt once the migration is applied.
export async function sendTrackedEmail(input: TrackedEmailInput): Promise<TrackedEmailResult> {
  if (!isValidEmailFormat(input.recipientEmail)) {
    return { sent: false, skipped: true, error: "invalid_recipient" };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: insertError } = await admin.from("email_delivery_log").insert({
    idempotency_key: input.idempotencyKey,
    template_type: input.templateType,
    recipient_role: input.recipientRole,
    recipient_email: input.recipientEmail.trim().toLowerCase(),
    related_record_type: input.relatedRecordType,
    related_record_id: input.relatedRecordId,
    status: "pending",
    attempt_count: 1,
    last_attempt_at: now,
    metadata: input.metadata ?? {},
  });

  if (insertError) {
    if ((insertError as { code?: string }).code === "23505") {
      return { sent: false, skipped: true, duplicate: true };
    }
    // Do not prevent a booking/invitation that already committed from
    // notifying its recipient if a deployment temporarily lacks this new
    // table. The error remains visible in server logs and is removed once
    // the migration is applied before deploying this code.
    console.error("[email] could not create a delivery-log record", insertError);
    const fallback = await sendEmailSafely({
      to: input.recipientEmail,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToPlainText(input.html),
      replyTo: input.replyTo,
    });
    return {
      sent: !fallback.skipped && !fallback.error,
      skipped: fallback.skipped,
      trackingUnavailable: true,
      ...(fallback.error ? { error: fallback.error } : {}),
    };
  }

  const result = await sendEmailSafely({
    to: input.recipientEmail,
    subject: input.subject,
    html: input.html,
    text: input.text ?? htmlToPlainText(input.html),
    replyTo: input.replyTo,
  });
  const update = result.error || result.skipped
    ? {
        status: "failed" as const,
        failure_reason: result.skipped ? "provider_not_configured" : result.error,
      }
    : {
        status: "sent" as const,
        provider_message_id: result.messageId ?? null,
        sent_at: new Date().toISOString(),
      };

  const { error: updateError } = await admin
    .from("email_delivery_log")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("idempotency_key", input.idempotencyKey);
  if (updateError) console.error("[email] could not finalize delivery-log record", updateError);

  return {
    sent: !result.skipped && !result.error,
    skipped: result.skipped,
    ...(result.error ? { error: result.error } : {}),
  };
}
