import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { getSiteContent } from "@/lib/queries";
import { mergeDesignTokens, type DesignTokens } from "@/lib/ui-builder/types";

// Phase 132 — draft persistence for the admin UI Builder. Follows
// app/api/admin/users/route.ts's convention for API routes (inline
// getCurrentProfile() + role check returning JSON 401/403), not
// requireAdmin() — that helper redirects, which is wrong for a fetch-based
// route (see EXECUTION_PLAN.md Phase 132).
//
// Scope is hardcoded to "global" — crm_ui_drafts.scope exists as a column
// (not a fixed single row) so a later phase can add per-page drafts without
// a schema change, but nothing writes any other scope yet.
const SCOPE = "global";

async function requireAdminOrJson() {
  const me = await getCurrentProfile();
  if (!me) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) } as const;
  if (me.role !== "admin") return { error: NextResponse.json({ error: "Only administrators can use the UI Builder." }, { status: 403 }) } as const;
  return { me } as const;
}

// GET — loads the in-progress draft if one exists; otherwise falls back to
// the currently *published* theme_tokens (so opening the builder for the
// first time shows the live site's real values, not blank defaults);
// otherwise DEFAULT_DESIGN_TOKENS (mirrors globals.css, so a totally fresh
// install still shows something correct).
export async function GET() {
  const gate = await requireAdminOrJson();
  if ("error" in gate) return gate.error;

  const supabase = await createClient();
  const { data: draftRow } = await supabase
    .from("crm_ui_drafts")
    .select("schema, updated_at")
    .eq("scope", SCOPE)
    .maybeSingle();

  if (draftRow?.schema) {
    return NextResponse.json({
      tokens: mergeDesignTokens(draftRow.schema as Partial<DesignTokens>),
      source: "draft",
      updatedAt: draftRow.updated_at,
    });
  }

  const published = await getSiteContent<Partial<DesignTokens>>("theme_tokens");
  return NextResponse.json({
    tokens: mergeDesignTokens(published ?? undefined),
    source: published ? "published" : "default",
    updatedAt: null,
  });
}

// PUT — autosaved by the builder shell on every change (debounced
// client-side), so closing the tab mid-edit never loses work. Upserts on
// the "scope" primary key, same upsert-on-conflict pattern used by
// booking_intake_forms/diary_scheduling_events elsewhere in this app.
export async function PUT(request: Request) {
  const gate = await requireAdminOrJson();
  if ("error" in gate) return gate.error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid draft payload." }, { status: 400 });
  }

  const tokens = mergeDesignTokens(body as Partial<DesignTokens>);
  const supabase = await createClient();
  const { error } = await supabase.from("crm_ui_drafts").upsert(
    {
      scope: SCOPE,
      schema: tokens,
      updated_by: gate.me.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "scope" }
  );

  if (error) {
    return NextResponse.json({ error: "Could not save draft — try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, tokens });
}

// DELETE — "discard draft" (reverts the builder to the published tokens on
// next load). Not destructive to anything live; only clears the staging row.
export async function DELETE() {
  const gate = await requireAdminOrJson();
  if ("error" in gate) return gate.error;

  const supabase = await createClient();
  const { error } = await supabase.from("crm_ui_drafts").delete().eq("scope", SCOPE);
  if (error) {
    return NextResponse.json({ error: "Could not discard draft — try again." }, { status: 500 });
  }
  const published = await getSiteContent<Partial<DesignTokens>>("theme_tokens");
  return NextResponse.json({ ok: true, tokens: mergeDesignTokens(published ?? undefined) });
}
