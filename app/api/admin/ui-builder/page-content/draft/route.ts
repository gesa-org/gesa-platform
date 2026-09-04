import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { getPageContent } from "@/lib/content";
import { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import { getPageDefinition, getEditableFields } from "@/lib/ui-builder/pageRegistry";
import { extractFieldValues, applyDraftPatch } from "@/lib/ui-builder/pageContentResolver";

// Phase 133 — draft persistence for the Visual Page Editor's per-page text
// content, parallel to app/api/admin/ui-builder/draft/route.ts (the global
// theme tokens draft) but scoped per page (`crm_ui_drafts.scope =
// "page:<pageKey>"`) and validated against that page's field registry
// instead of the fixed DesignTokens shape — this is the "admin cannot write
// arbitrary unknown fields into content_json" requirement, enforced here on
// both read (extractFieldValues only ever returns registered contentIds)
// and write (applyDraftPatch / the PUT handler below only accepts
// registered contentIds, silently drops anything else).
//
// Home is the only page with a registry today (see pageRegistry.ts) — an
// unsupported pageKey returns 400, matching the spec's own "if the page is
// unsupported for visual editing" branch.

async function requireAdminOrJson() {
  const me = await getCurrentProfile();
  if (!me) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) } as const;
  if (me.role !== "admin") return { error: NextResponse.json({ error: "Only administrators can use the Page Editor." }, { status: 403 }) } as const;
  return { me } as const;
}

function getFallbackForPage(pageKey: string): Record<string, unknown> {
  // Only Home has a real fallback wired up this phase. Extending this to
  // another page is one line here plus a registry entry in pageRegistry.ts
  // (see EXECUTION_PLAN.md Phase 133, "how to add a new editable field").
  if (pageKey === "home") return HOME_CONTENT_FALLBACK as unknown as Record<string, unknown>;
  return {};
}

export async function GET(request: Request) {
  const gate = await requireAdminOrJson();
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(request.url);
  const pageKey = searchParams.get("pageKey") ?? "";
  const def = getPageDefinition(pageKey);
  if (!def || !def.supportsVisualEditor) {
    return NextResponse.json({ error: "This page doesn't support the visual editor yet." }, { status: 400 });
  }

  const fallback = getFallbackForPage(pageKey);
  const published = await getPageContent(def.siteContentKey, fallback);

  const supabase = await createClient();
  const { data: draftRow } = await supabase
    .from("crm_ui_drafts")
    .select("schema, updated_at")
    .eq("scope", `page:${pageKey}`)
    .maybeSingle();

  const patch = (draftRow?.schema as Record<string, unknown> | null) ?? null;
  const resolved = applyDraftPatch(pageKey, published, patch);

  return NextResponse.json({
    fields: extractFieldValues(pageKey, resolved),
    source: draftRow?.schema ? "draft" : "published",
    updatedAt: draftRow?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const gate = await requireAdminOrJson();
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(request.url);
  const pageKey = searchParams.get("pageKey") ?? "";
  const def = getPageDefinition(pageKey);
  if (!def || !def.supportsVisualEditor) {
    return NextResponse.json({ error: "This page doesn't support the visual editor yet." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid draft payload." }, { status: 400 });
  }

  // Only registered contentIds for this page survive into the saved patch —
  // an unknown key in the payload is silently dropped, not stored.
  const allowed = new Set(getEditableFields(pageKey).map((f) => f.contentId));
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (allowed.has(key) && typeof value === "string") sanitized[key] = value;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_ui_drafts").upsert(
    {
      scope: `page:${pageKey}`,
      schema: sanitized,
      updated_by: gate.me.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "scope" }
  );

  if (error) {
    return NextResponse.json({ error: "Could not save draft — try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, fields: sanitized });
}

export async function DELETE(request: Request) {
  const gate = await requireAdminOrJson();
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(request.url);
  const pageKey = searchParams.get("pageKey") ?? "";
  const def = getPageDefinition(pageKey);
  if (!def || !def.supportsVisualEditor) {
    return NextResponse.json({ error: "This page doesn't support the visual editor yet." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_ui_drafts").delete().eq("scope", `page:${pageKey}`);
  if (error) {
    return NextResponse.json({ error: "Could not discard draft — try again." }, { status: 500 });
  }

  const fallback = getFallbackForPage(pageKey);
  const published = await getPageContent(def.siteContentKey, fallback);
  return NextResponse.json({ ok: true, fields: extractFieldValues(pageKey, published) });
}
