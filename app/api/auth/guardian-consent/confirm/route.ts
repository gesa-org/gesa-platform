import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateGuardianConsentToken } from "@/lib/guardianConsent";

// Phase 214 — the guardian's actual "I confirm" action, submitted from
// GuardianConsentForm.tsx on the public /guardian-consent page. Re-validates
// the token server-side (never trusts that the page's own server-side
// validation is still true by the time the guardian clicks confirm — the
// link could have expired or been used in another tab in between) before
// doing anything. Uses the service-role client for both the read and the
// two writes below: this is an unauthenticated guardian, not a signed-in
// profile, and the write to `profiles.account_status` specifically requires
// service_role — protect_profile_account_status_column_trigger rejects that
// column change from anyone else, by design (see the Phase 214 migration).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token as string | undefined;
  const consent = body?.consent === true;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Guardian consent checkbox must be checked." }, { status: 400 });
  }

  const result = await validateGuardianConsentToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: "invalid", reason: result.reason }, { status: 409 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const forwardedFor = request.headers.get("x-forwarded-for");
  const consentedIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() ?? null : null;

  const { error: consentUpdateError } = await admin
    .from("guardian_consents")
    .update({ status: "confirmed", consented_at: now, consented_ip: consentedIp, updated_at: now })
    .eq("id", result.consent.id);
  if (consentUpdateError) {
    return NextResponse.json({ error: "Could not record consent — try again." }, { status: 500 });
  }

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({ account_status: "active" })
    .eq("id", result.consent.profile_id);
  if (profileUpdateError) {
    return NextResponse.json({ error: "Consent recorded, but the account could not be activated — contact GESA support." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
