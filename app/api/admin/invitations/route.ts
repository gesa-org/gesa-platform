import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { createAndSendInvitation, baseUrlFromRequest, isRateLimited } from "@/lib/invitations";
import type { InvitedRole } from "@/lib/database.types";

// Phase 187 — single-invitation send, used by "Send invitation" on an
// individual Our Professionals row, the Administrators page's "Invite
// Administrator" modal, and (indirectly, via the shared helper) the
// approve-and-invite volunteer-application flow. Bulk therapist invitations
// go through app/api/admin/invitations/bulk/route.ts instead, which loops
// this same createAndSendInvitation() helper.

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin" && me.role !== "super_admin") {
    return NextResponse.json({ error: "Only administrators can send invitations." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const invitedRole = body?.invitedRole as InvitedRole | undefined;
  if (!invitedRole || !["therapist", "admin", "super_admin"].includes(invitedRole)) {
    return NextResponse.json({ error: "A valid invited role is required." }, { status: 400 });
  }
  // Only a Super Admin may grant Super Admin — an Administrator inviting
  // another Administrator (or a Professional) is fine, but role escalation
  // to the top tier requires the top tier.
  if (invitedRole === "super_admin" && me.role !== "super_admin") {
    return NextResponse.json({ error: "Only a Super Admin can invite another Super Admin." }, { status: 403 });
  }

  if (isRateLimited(`invite:${me.id}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many invitations sent recently — please wait a few minutes and try again." }, { status: 429 });
  }

  const email = body?.email as string | undefined;
  if (!email) {
    return NextResponse.json({ error: "An email address is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const result = await createAndSendInvitation(supabase, {
    email,
    firstName: body?.firstName ?? null,
    lastName: body?.lastName ?? null,
    invitedRole,
    therapistProfileId: body?.therapistProfileId ?? null,
    volunteerApplicationId: body?.volunteerApplicationId ?? null,
    invitedByUserId: me.id,
    invitedByLabel: me.email ?? me.id,
    baseUrl: baseUrlFromRequest(request),
  });

  if (!result.ok) {
    const status = result.code === "invalid_email" ? 400 : result.code === "duplicate_active" ? 409 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, invitationId: result.invitationId });
}
