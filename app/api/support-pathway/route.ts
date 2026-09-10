import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportPathway } from "@/lib/database.types";

// Phase 184 — "ai" removed from the accepted pathway list. It used to be
// called from MatchWizard's own mount effect (and, redundantly, from
// ChoiceScreen.tsx's "AI Support" click too — one click, two rows), creating
// a support_requests row with status "started" before the client had
// answered a single question. That row surfaced as a real admin
// notification ("New Find Support request — Anonymous") for anyone who
// merely opened the wizard and left. The AI pathway's row is now created
// exactly once, by /api/support-match, the first time the client actually
// submits real preferences — see MatchWizard.tsx and EXECUTION_PLAN.md
// Phase 184. Restricting this route to "manual" only closes the door on the
// same premature-row bug being reintroduced through this endpoint later.
const PATHWAYS: SupportPathway[] = ["manual"];

// Phase 142 — logs the "manual" (browse-directory) pathway to
// support_requests purely for CRM visibility, the moment the client picks
// it on the choice screen (components/find-support/ChoiceScreen.tsx). The
// row is created already in its terminal "redirected_manual" status since
// that flow collects nothing else before handing off to Our Professionals —
// clicking through *is* the complete action for this pathway, not a draft.
// Always writes through the service-role admin client — this table has no
// public RLS policy at all (see the create_support_requests migration).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pathwayRaw = body?.pathway as string | undefined;

  if (!pathwayRaw || !PATHWAYS.includes(pathwayRaw as SupportPathway)) {
    return NextResponse.json({ error: "a valid pathway ('manual') is required" }, { status: 400 });
  }
  const pathway = pathwayRaw as SupportPathway;

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("support_requests")
    .insert({
      pathway,
      status: "redirected_manual",
      source_page: "find-your-therapist",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "could not record pathway selection" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
