import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/adminAuditLog";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "therapist"
  );
}

// Phase 186 — the one deliberate, explicit action that turns an approved
// volunteer_applications row into a real therapists row. Everything else in
// this workflow (submitting an application, marking it reviewing/approved/
// rejected/withdrawn) goes through a plain RLS-protected client-side
// update, same lightweight pattern this codebase already uses everywhere
// (see VolunteerApplicationStatusSelect.tsx) — this one gets a dedicated
// server route instead because it has a real side effect (creating a new,
// linked therapists row) worth handling atomically, auditing, and giving a
// clear, specific error message for, rather than leaving to a raw insert
// whose only guardrail would be the DB trigger's generic exception text.
//
// Runs through the signed-in admin's own request-scoped Supabase client
// (`lib/supabase/server.ts`), never the service-role client — RLS plus the
// `protect_therapist_sensitive_fields` trigger (Phase 186) are the real,
// DB-level authority here; the role check below exists to fail fast with a
// clean message rather than a raw Postgres/RLS error, and to run before any
// query.
export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can create a professional profile from an application." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const applicationId = body?.applicationId as string | undefined;
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: application, error: applicationError } = await supabase
    .from("therapist_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (applicationError) {
    return NextResponse.json({ error: "Could not load that application." }, { status: 500 });
  }
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  // Main rule of this phase: a therapist profile may only ever come from an
  // Approved application. If it isn't already, approve it as part of this
  // same action (matches the spec's "Approve and create professional
  // profile" combined action) rather than requiring two separate round
  // trips — but never silently promote a Rejected/Withdrawn application.
  if (application.status !== "approved") {
    if (application.status === "rejected" || application.status === "withdrawn") {
      return NextResponse.json(
        { error: `This application is ${application.status} and cannot be used to create a professional profile.` },
        { status: 409 }
      );
    }
    const { error: approveError } = await supabase
      .from("therapist_applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: me.id })
      .eq("id", applicationId);
    if (approveError) {
      return NextResponse.json({ error: "Could not approve that application." }, { status: 500 });
    }
  }

  // Already has a linked profile — don't create a second one. Point the
  // caller at the existing one instead of erroring outright, since this can
  // legitimately happen on a retried click.
  const { data: existingLink } = await supabase
    .from("therapists")
    .select("id")
    .eq("volunteer_application_id", applicationId)
    .maybeSingle();
  if (existingLink) {
    return NextResponse.json({ therapistId: existingLink.id, alreadyExisted: true });
  }

  const baseSlug = slugify(application.full_name);
  let therapistId: string | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("therapists")
      .insert({
        full_name: application.full_name,
        slug,
        // Phase 186 — pre-filled draft from the approved application, per
        // the spec: "Require the administrator to review and edit all
        // public-facing details before saving." Nothing here is published —
        // profile_status defaults to "draft" (is_active mirrors it to
        // false) until an admin explicitly publishes it from the edit page.
        bio: application.bio || null,
        credentials: application.credentials_proof || null,
        contact_email: application.email || null,
        contact_phone: application.phone || null,
        specialties: application.specialties ?? [],
        languages: application.languages ?? [],
        profile_status: "draft",
        is_active: false,
        volunteer_application_id: applicationId,
      })
      .select("id")
      .single();

    if (!error && data) {
      therapistId = data.id;
      break;
    }
    if (error?.code === "23505") {
      lastError = "slug conflict";
      continue;
    }
    lastError = error?.message || "Could not create the professional profile.";
    break;
  }

  if (!therapistId) {
    return NextResponse.json({ error: lastError || "Could not create the professional profile." }, { status: 500 });
  }

  await logAdminAction(supabase, {
    adminId: me.email ?? me.id,
    action: "therapist.create_from_application",
    targetType: "therapist",
    targetId: therapistId,
    metadata: { name: application.full_name, volunteer_application_id: applicationId },
  });

  return NextResponse.json({ therapistId, alreadyExisted: false });
}
