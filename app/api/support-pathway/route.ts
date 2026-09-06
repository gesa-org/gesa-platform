import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportPathway } from "@/lib/database.types";

const PATHWAYS: SupportPathway[] = ["ai", "manual"];

// Phase 142 — creates the single support_requests row a "Find Support"
// journey will live in from here on. Called from:
//   - MatchWizard on mount (pathway "ai"), the instant a client picks "AI
//     Support" on the choice screen (components/find-support/ChoiceScreen).
//   - The choice screen itself for "Manual Support" (pathway "manual"),
//     purely so both pathways show up in one CRM view — the row is created
//     already in its terminal "redirected_manual" status since that flow
//     collects nothing else before handing off to Our Professionals.
// Always writes through the service-role admin client — this table has no
// public RLS policy at all (see the create_support_requests migration).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pathwayRaw = body?.pathway as string | undefined;

  if (!pathwayRaw || !PATHWAYS.includes(pathwayRaw as SupportPathway)) {
    return NextResponse.json({ error: "a valid pathway ('ai' or 'manual') is required" }, { status: 400 });
  }
  const pathway = pathwayRaw as SupportPathway;

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("support_requests")
    .insert({
      pathway,
      status: pathway === "manual" ? "redirected_manual" : "started",
      source_page: "find-your-therapist",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "could not record pathway selection" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
