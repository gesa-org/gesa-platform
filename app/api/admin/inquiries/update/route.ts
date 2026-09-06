import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InquiryRow } from "@/lib/database.types";

// Phase 150 — backs both the status dropdown and the admin-notes field on
// /admin/inquiries. Same server-authorized pattern as
// app/api/admin/support-requests/status/route.ts; kept as one combined
// route (rather than a separate one per field) since both are small,
// low-risk text updates on the same row made from the same detail view.
const STATUSES = ["New", "Seen", "In Progress", "Resolved", "Archived"];

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const status = body?.status as string | undefined;
  const adminNotes = body?.adminNotes as string | null | undefined;

  if (!id) {
    return NextResponse.json({ error: "a valid id is required" }, { status: 400 });
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const update: Partial<Pick<InquiryRow, "status" | "admin_notes">> = {};
  if (status !== undefined) update.status = status;
  if (adminNotes !== undefined) update.admin_notes = adminNotes;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.from("inquiries").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: "could not update inquiry" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
