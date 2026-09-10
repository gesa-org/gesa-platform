import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 150 — support_requests has zero RLS policies at all, by design
// (see lib/queries.ts's getAllSupportRequests() comment — it collects more
// sensitive data, including an open-text feelings field, than
// match_requests ever did, so it was deliberately never opened up to any
// RLS-based read, even for admins). NotificationBell.tsx is a Client
// Component that can only use the anon-key browser client — querying
// support_requests directly from there returns nothing (denied by RLS),
// which is exactly the bug this route fixes: this is the one place
// NotificationBell needs support_requests data, so it's fetched here,
// server-side, through the service-role client, after re-checking the
// caller's own role — never by handing the browser a direct query.
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const adminSupabase = createAdminClient();

  if (profile.role === "admin") {
    const { data, error } = await adminSupabase
      .from("support_requests")
      .select("id, full_name, email, session_format, status, created_at, selected_therapist:therapists(full_name)")
      // Phase 184 — excludes "started" rows (a draft row from the moment a
      // client merely opened the AI Support wizard, before answering
      // anything — see lib/queries.ts's getAllSupportRequests() for the
      // full writeup of the bug this closes). Without this, an abandoned
      // wizard open would ring the bell as "New Find Support request —
      // Anonymous."
      .neq("status", "started")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) return NextResponse.json({ error: "could not load requests" }, { status: 500 });
    return NextResponse.json({ requests: data ?? [] });
  }

  if (profile.role === "therapist") {
    const { data: therapist } = await adminSupabase
      .from("therapists")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!therapist) return NextResponse.json({ requests: [] });

    const { data, error } = await adminSupabase
      .from("support_requests")
      .select("id, full_name, session_format, preferred_date, preferred_time, status, created_at")
      .eq("selected_therapist_id", therapist.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) return NextResponse.json({ error: "could not load requests" }, { status: 500 });
    return NextResponse.json({ requests: data ?? [] });
  }

  return NextResponse.json({ error: "not authorized" }, { status: 403 });
}
