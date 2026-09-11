import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/adminAuditLog";
import { sendEmailSafely, isValidEmailFormat } from "@/lib/email/resend";
import { therapistInvitationEmail, administratorInvitationEmail } from "@/lib/email/templates";
import type { Database, Tables, InvitedRole } from "@/lib/database.types";

// Phase 187 — shared invitation-token primitives. Used by every invitation
// API route (create/resend on the admin side, accept on the public side) so
// there is exactly one place that knows how a token is generated, hashed,
// and validated.
//
// The raw token is a 32-byte cryptographically-random value, base64url
// encoded, and only ever exists in memory long enough to (a) go into the
// invitation email's URL and (b) get hashed before being stored. The
// database only ever holds `token_hash` (sha256 hex digest) — this mirrors
// how a password would be handled, and means a database dump/leak alone
// can never be used to accept an invitation.
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Moved here (out of any single route.ts) since Next.js route handler files
// are only meant to export the HTTP-verb functions themselves (GET/POST/…)
// plus a small known set of special names — an arbitrary extra named export
// there risks tripping the framework's own route-shape type checking.
export function baseUrlFromRequest(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl;
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  if (host) return `https://${host}`;
  return "https://gesa-platform.vercel.app";
}

export const INVITATION_EXPIRY_DAYS_DEFAULT = 7;

export function invitationExpiryDate(days: number = INVITATION_EXPIRY_DAYS_DEFAULT): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export type InvitationRow = Tables<"invitations">;

export type InvitationValidationResult =
  | { ok: true; invitation: InvitationRow }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "accepted" | "invalid_status" };

// Server-only. Looks up an invitation purely by the hash of the token the
// visitor presented — no session, no cookie, nothing else identifies them.
// Uses the service-role client deliberately: an unauthenticated visitor
// hitting /accept-invitation has no profiles row and no RLS-visible session,
// so the *only* authorization check here is "does this exact token hash
// exist, unexpired, in a status that can still be accepted" — the same
// security model as a password-reset link.
export async function validateInvitationToken(token: string): Promise<InvitationValidationResult> {
  const admin = createAdminClient();
  const tokenHash = hashInvitationToken(token);

  const { data, error } = await admin.from("invitations").select("*").eq("token_hash", tokenHash).maybeSingle();
  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }
  if (data.status === "accepted") {
    return { ok: false, reason: "accepted" };
  }
  if (data.status === "revoked") {
    return { ok: false, reason: "revoked" };
  }
  if (data.status !== "sent" && data.status !== "opened") {
    return { ok: false, reason: "invalid_status" };
  }
  if (new Date(data.token_expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, invitation: data };
}

const ROLE_LABEL: Record<InvitedRole, "Administrator" | "Super Admin" | "Professional"> = {
  therapist: "Professional",
  admin: "Administrator",
  super_admin: "Super Admin",
};

export type CreateInvitationInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  invitedRole: InvitedRole;
  therapistProfileId?: string | null;
  volunteerApplicationId?: string | null;
  invitedByUserId: string;
  invitedByLabel: string; // for the audit log's admin_id (matches this codebase's existing free-text convention)
  baseUrl: string;
  expiryDays?: number;
};

export type CreateInvitationResult =
  | { ok: true; invitationId: string }
  | { ok: false; error: string; code: "invalid_email" | "duplicate_active" | "db_error" };

// The one place that creates + sends an invitation, shared by the single-
// invite route, the bulk-therapist route, and the volunteer-application
// approve-and-invite flow — so token generation, the duplicate-active-invite
// check, the email send, and the audit-log entry can never drift apart
// between those three call sites. `supabase` must be the caller's own
// request-scoped client (never the service-role client) so the
// `invitations_admin_all` RLS policy is the real authority on "is this
// caller actually allowed to create an invitation" — this function does not
// re-check the caller's role itself.
export async function createAndSendInvitation(
  supabase: SupabaseClient<Database>,
  input: CreateInvitationInput
): Promise<CreateInvitationResult> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmailFormat(email)) {
    return { ok: false, error: "Not a valid email address.", code: "invalid_email" };
  }

  // Friendly pre-check ahead of the DB's own partial-unique-index guarantee
  // (invitations_active_email_role_idx) — gives a clear, specific error
  // instead of a raw Postgres unique-violation message.
  const { data: existing } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("email", email)
    .eq("invited_role", input.invitedRole)
    .in("status", ["sent", "opened"])
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      error: `An active ${ROLE_LABEL[input.invitedRole]} invitation already exists for ${email} — resend it instead of creating a new one.`,
      code: "duplicate_active",
    };
  }

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = invitationExpiryDate(input.expiryDays);

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      email,
      first_name: input.firstName?.trim() || null,
      last_name: input.lastName?.trim() || null,
      invited_role: input.invitedRole,
      therapist_profile_id: input.therapistProfileId ?? null,
      volunteer_application_id: input.volunteerApplicationId ?? null,
      invited_by_user_id: input.invitedByUserId,
      token_hash: tokenHash,
      token_expires_at: expiresAt,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !invitation) {
    // 23505 here means the DB-level partial unique index caught a race the
    // pre-check above missed (two admins clicking "invite" at once).
    const duplicate = (error as { code?: string } | null)?.code === "23505";
    return {
      ok: false,
      error: duplicate
        ? `An active ${ROLE_LABEL[input.invitedRole]} invitation already exists for ${email}.`
        : "Could not create the invitation — try again.",
      code: duplicate ? "duplicate_active" : "db_error",
    };
  }

  const acceptUrl = `${input.baseUrl.replace(/\/$/, "")}/accept-invitation?token=${token}`;
  const expiresAtLabel = new Date(expiresAt).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const html =
    input.invitedRole === "therapist"
      ? therapistInvitationEmail({ firstName: input.firstName ?? null, acceptUrl, expiresAtLabel })
      : administratorInvitationEmail({
          firstName: input.firstName ?? null,
          acceptUrl,
          expiresAtLabel,
          roleLabel: input.invitedRole === "super_admin" ? "Super Admin" : "Administrator",
        });
  const subject =
    input.invitedRole === "therapist"
      ? "You're invited to join GESA as a Professional"
      : "You're invited to join the GESA Admin Team";

  const sendResult = await sendEmailSafely({ to: email, subject, html });
  if (sendResult.error) {
    // The invitation row already exists — don't roll it back (an admin can
    // resend it, which retries the email without creating a duplicate row).
    // Mark it "failed" so the CRM surfaces this instead of showing a
    // silently-stuck "sent" row that was never actually delivered.
    await supabase.from("invitations").update({ status: "failed" }).eq("id", invitation.id);
  }

  await logAdminAction(supabase, {
    adminId: input.invitedByLabel,
    action: sendResult.error ? "invitation.send_failed" : "invitation.sent",
    targetType: "invitation",
    targetId: invitation.id,
    metadata: { email, invited_role: input.invitedRole, skipped: sendResult.skipped ?? false },
  });

  return { ok: true, invitationId: invitation.id };
}

// Best-effort, single-instance-scoped rate limiting. This app has no shared
// cache/Redis, and Vercel serverless functions don't share memory across
// instances — so this is a real but partial mitigation (defense against a
// single burst hitting one warm instance), not a hard guarantee, and is
// documented as such in EXECUTION_PLAN.md. The DB-level unique index on
// (email, invited_role) for active invitations is the actual hard limit on
// invitation spam to one address.
const attempts = new Map<string, number[]>();
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  attempts.set(key, list);
  return list.length > max;
}
