import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/database.types";

// Phase 82 — "Add user" on /admin/users. `profiles.id` has no default and
// must equal a real `auth.users.id` (see lib/database.types.ts's Insert
// type — `Pick<ProfileRow, "id">` is required), so a new user can never be
// created with a plain client-side `.insert()` the way a new FAQ or
// therapist row can. This is the first real caller of
// lib/supabase/admin.ts's `createAdminClient()` (the service-role client —
// previously defined but never exercised anywhere in the app), used here to
// call Supabase's Auth Admin API and mint a real `auth.users` row directly,
// server-side only, since the service-role key must never reach the
// browser.
//
// `handle_new_user()` (the existing Postgres trigger that already runs on
// every real signup) reads `raw_user_meta_data->>'full_name'` and
// `raw_user_meta_data->>'role'` to build the matching `profiles` row — so
// passing both in `user_metadata` here means the trigger does the right
// thing immediately, with no separate follow-up update needed.
//
// This generates a temporary password rather than relying on Supabase's own
// invite-email flow, since this project's transactional email (Resend) and
// Supabase's own SMTP setup are two separate, independently-configured
// systems — depending on Supabase's invite email actually being configured
// would be a silent, hard-to-diagnose failure mode if it wasn't. Returning
// the password once, here, works regardless of email configuration; the
// admin is expected to relay it to the new user through a secure channel of
// their choosing, who can then change it (or use the existing
// /forgot-password flow) after first sign-in.
function generateTempPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const base = Buffer.from(bytes).toString("base64").replace(/[+/=]/g, "");
  // Guarantee at least one digit and one uppercase letter regardless of what
  // the random slice happened to contain, so this always satisfies a
  // typical "at least one number" password rule even though Supabase's own
  // minimum here is just length.
  return `${base.slice(0, 14)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Phase 187 — "admin", "super_admin", and "therapist" removed from this
// route's allowed roles. Per this phase's spec, those three roles may only
// ever be granted by accepting an invitation (see
// app/api/admin/invitations/**/route.ts and app/api/invitations/accept) —
// this direct-create path stays available for the lower-sensitivity
// internal roles it was always meant for (a plain client account, or an
// internal reviewer/finance seat) where instant creation with a relayed
// temp password is still an acceptable, lower-stakes flow.
const VALID_ROLES: AppRole[] = ["reviewer", "client", "finance"];

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can add users." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const fullName = (body?.fullName as string | undefined)?.trim() ?? "";
  const email = (body?.email as string | undefined)?.trim().toLowerCase() ?? "";
  const role = (body?.role as string | undefined) ?? "client";

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role as AppRole)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  // SUPABASE_SERVICE_ROLE_KEY was previously unset in every environment
  // (documented in EXECUTION_PLAN.md/ENV_VARS.md as "not yet used by any
  // live flow") — this route is the first thing that actually needs it.
  // Fail with a clear, actionable message rather than letting
  // createAdminClient()/the Auth Admin API throw an opaque "supabaseKey is
  // required" error if it's still unset in this environment.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server is missing SUPABASE_SERVICE_ROLE_KEY — add it in this environment's settings, then retry." },
      { status: 500 }
    );
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    // Supabase surfaces "already registered" as a 422/"already exists"
    // style error — pass a clean, specific message through rather than the
    // raw Auth API error text.
    const message = /already|exists/i.test(error.message)
      ? "A user with that email already exists."
      : error.message || "Could not create the user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Phase 187 — handle_new_user() no longer reads a "role" key out of
  // user_metadata (that path was removed in Phase 178 as a self-escalation
  // fix — anyone hitting Supabase's own signUp() directly could otherwise
  // pass whatever role they wanted). It always inserts the new profiles row
  // as role 'client'. This route previously passed `role` in the metadata
  // above expecting the trigger to apply it — it silently never did, so
  // every user created here landed as 'client' regardless of the admin's
  // selection. Fixed by explicitly setting it here via the service-role
  // client (bypasses the profiles self-escalation-guard trigger by design,
  // same as the invitation-acceptance route).
  if (data.user && role !== "client") {
    await admin.from("profiles").update({ role }).eq("id", data.user.id);
  }

  return NextResponse.json({ userId: data.user?.id, tempPassword });
}
