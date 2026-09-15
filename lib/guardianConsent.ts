import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSafely, isValidEmailFormat } from "@/lib/email/resend";
import { guardianConsentEmail } from "@/lib/email/templates";
import { CURRENT_TERMS_VERSION } from "@/lib/auth/age";
import type { GuardianConsentRow } from "@/lib/database.types";

// Phase 214 — guardian-consent token primitives, deliberately mirroring
// lib/invitations.ts's own token generation/hashing/validation exactly
// (same 32-byte random token, base64url-encoded; same sha256 token_hash at
// rest; same "only the service-role client, no visitor session, can ever
// look this up" security model as /accept-invitation). A minor's
// registration has no authenticated session to gate this on — the guardian
// clicking an emailed link is the entire authorization mechanism, same as
// accepting a staff invitation.
export function generateGuardianConsentToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashGuardianConsentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const GUARDIAN_CONSENT_EXPIRY_DAYS = 7;

export function guardianConsentExpiryDate(days: number = GUARDIAN_CONSENT_EXPIRY_DAYS): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function baseUrlFromRequest(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl;
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  if (host) return `https://${host}`;
  return "https://gesa-platform.vercel.app";
}

export type GuardianConsentValidationResult =
  | { ok: true; consent: GuardianConsentRow; profile: { id: string; full_name: string | null; email: string | null } }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "confirmed" };

// Server-only. Same lookup shape as validateInvitationToken(): find purely
// by the hash of the token the guardian presented, via the service-role
// client, since an unauthenticated guardian has no profiles row of their
// own and no RLS-visible session.
export async function validateGuardianConsentToken(token: string): Promise<GuardianConsentValidationResult> {
  const admin = createAdminClient();
  const tokenHash = hashGuardianConsentToken(token);

  const { data, error } = await admin.from("guardian_consents").select("*").eq("token_hash", tokenHash).maybeSingle();
  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }
  if (data.status === "confirmed") {
    return { ok: false, reason: "confirmed" };
  }
  if (data.status === "revoked") {
    return { ok: false, reason: "revoked" };
  }
  if (new Date(data.token_expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const { data: profile } = await admin.from("profiles").select("id, full_name, email").eq("id", data.profile_id).maybeSingle();
  if (!profile) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, consent: data, profile };
}

export type CreateGuardianConsentInput = {
  profileId: string;
  minorName: string | null;
  guardianFullName: string;
  guardianEmail: string;
  guardianRelationship: string;
  baseUrl: string;
};

export type CreateGuardianConsentResult = { ok: true } | { ok: false; error: string };

// Server-only, called right after a minor's Supabase Auth account is
// created (see app/api/auth/guardian-consent/route.ts). Uses the
// service-role client deliberately — the newly-created minor has no active
// session yet at this point in most flows (Supabase Auth typically requires
// email confirmation before issuing one), so there is no request-scoped
// client available to use instead. This function does not re-verify the
// caller's authority to do this; the API route calling it is responsible
// for validating profileId/account_status first.
export async function createAndSendGuardianConsent(input: CreateGuardianConsentInput): Promise<CreateGuardianConsentResult> {
  const admin = createAdminClient();
  const guardianEmail = input.guardianEmail.trim().toLowerCase();
  if (!isValidEmailFormat(guardianEmail)) {
    return { ok: false, error: "Not a valid guardian email address." };
  }

  const token = generateGuardianConsentToken();
  const tokenHash = hashGuardianConsentToken(token);
  const expiresAt = guardianConsentExpiryDate();

  const { error: insertError } = await admin.from("guardian_consents").insert({
    profile_id: input.profileId,
    guardian_full_name: input.guardianFullName.trim(),
    guardian_email: guardianEmail,
    guardian_relationship: input.guardianRelationship.trim(),
    token_hash: tokenHash,
    token_expires_at: expiresAt,
    status: "pending",
    terms_version: CURRENT_TERMS_VERSION,
    sent_at: new Date().toISOString(),
  });

  if (insertError) {
    return { ok: false, error: "Could not create the guardian-consent request — try again." };
  }

  const consentUrl = `${input.baseUrl.replace(/\/$/, "")}/guardian-consent?token=${token}`;
  const expiresAtLabel = new Date(expiresAt).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sendResult = await sendEmailSafely({
    to: guardianEmail,
    subject: "Action needed: consent for a GESA account",
    html: guardianConsentEmail({
      guardianFullName: input.guardianFullName,
      minorName: input.minorName,
      consentUrl,
      expiresAtLabel,
    }),
  });

  if (sendResult.error) {
    console.error("[guardian-consent] email send failed for profile", input.profileId, sendResult.error);
  }

  return { ok: true };
}
