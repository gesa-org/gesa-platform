import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { createAndSendInvitation, baseUrlFromRequest, isRateLimited } from "@/lib/invitations";

// Phase 187 — bulk "Send invitation" from CRM > Our Professionals, for the
// 34 existing active therapists (and any future multi-select). Body:
// { therapistIds: string[] }. Loads each therapist's own contact_email
// (never trusts a client-supplied email list — the spec requires "send
// invitations only to records with valid email addresses", so the server is
// the one deciding what's valid, not the browser), then calls the same
// createAndSendInvitation() helper the single-invite route uses, one at a
// time. Reports success/failure/skipped/missing-email per record rather
// than failing the whole batch on the first problem.
export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin" && me.role !== "super_admin") {
    return NextResponse.json({ error: "Only administrators can send invitations." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const therapistIds = Array.isArray(body?.therapistIds) ? (body.therapistIds as string[]) : [];
  if (therapistIds.length === 0) {
    return NextResponse.json({ error: "Select at least one professional to invite." }, { status: 400 });
  }
  if (therapistIds.length > 100) {
    return NextResponse.json({ error: "Please invite at most 100 professionals at a time." }, { status: 400 });
  }
  if (isRateLimited(`invite-bulk:${me.id}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many bulk sends recently — please wait a few minutes and try again." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: therapists, error: fetchError } = await supabase
    .from("therapists")
    .select("id, full_name, contact_email, profile_status, profile_id")
    .in("id", therapistIds);
  if (fetchError) {
    return NextResponse.json({ error: "Could not load the selected professionals." }, { status: 500 });
  }

  const baseUrl = baseUrlFromRequest(request);
  const results: {
    sent: { id: string; email: string }[];
    skippedNoEmail: { id: string; fullName: string }[];
    skippedHasAccount: { id: string; fullName: string }[];
    failed: { id: string; email: string; reason: string }[];
  } = { sent: [], skippedNoEmail: [], skippedHasAccount: [], failed: [] };

  for (const t of therapists ?? []) {
    if (t.profile_id) {
      results.skippedHasAccount.push({ id: t.id, fullName: t.full_name });
      continue;
    }
    if (!t.contact_email) {
      results.skippedNoEmail.push({ id: t.id, fullName: t.full_name });
      continue;
    }
    const [firstName, ...rest] = t.full_name.trim().split(/\s+/);
    const result = await createAndSendInvitation(supabase, {
      email: t.contact_email,
      firstName: firstName ?? null,
      lastName: rest.join(" ") || null,
      invitedRole: "therapist",
      therapistProfileId: t.id,
      invitedByUserId: me.id,
      invitedByLabel: me.email ?? me.id,
      baseUrl,
    });
    if (result.ok) {
      results.sent.push({ id: t.id, email: t.contact_email });
    } else {
      results.failed.push({ id: t.id, email: t.contact_email, reason: result.error });
    }
  }

  // Any id in the request that didn't come back from the select at all
  // (bad id, or RLS hid it) — surface rather than silently drop.
  const foundIds = new Set((therapists ?? []).map((t) => t.id));
  const notFound = therapistIds.filter((id) => !foundIds.has(id));

  return NextResponse.json({ ...results, notFound });
}
