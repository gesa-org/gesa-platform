import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { getPageDefinition, getEditableFields, getRichTextMode } from "@/lib/ui-builder/pageRegistry";
import { extractFieldValues, applyDraftPatch, getPageBaseContent, sanitizeByMode } from "@/lib/ui-builder/pageContentResolver";
import { stripAllHtml } from "@/lib/ui-builder/sanitizeRichText";
import { enforceMaxLength } from "@/lib/ui-builder/enforceMaxLength";

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
// Phase 135 — generalized from "Home is the only page with a registry" to
// every page pageRegistry.ts lists with `supportsVisualEditor: true`, via
// getPageBaseContent() (reads every one of a page's `contentSources` and
// merges them, instead of this route knowing each page's fallback object
// by name). An unsupported pageKey (still `false` for the 5 legal pages)
// returns 400, matching the spec's own "if the page is unsupported for
// visual editing" branch.

async function requireAdminOrJson() {
  const me = await getCurrentProfile();
  if (!me) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) } as const;
  if (me.role !== "admin") return { error: NextResponse.json({ error: "Only administrators can use the Page Editor." }, { status: 403 }) } as const;
  return { me } as const;
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

  const published = await getPageBaseContent(pageKey);

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
  // an unknown key in the payload is silently dropped, not stored. Every
  // value is also sanitized per its *registered* mode, not whatever the
  // client claims it is — a "block" field's HTML goes through the full
  // toolbar allowlist, an "inline" field through the character-marks-only
  // allowlist, and everything else ("none") has all HTML stripped outright
  // — so a field can never be used to smuggle markup beyond what its own
  // mode allows, even if a request is hand-crafted rather than sent from
  // the real inspector UI.
  //
  // Phase 137 — `maxLength` is now enforced here too (not just displayed as
  // a counter), a real server-side backstop behind RichTextEditor.tsx's own
  // client-side revert-on-exceed: see enforceMaxLength.ts for why a
  // last-resort plain-text truncation, not a 400, is the right fallback for
  // an autosaving draft field.
  const fieldsForPage = getEditableFields(pageKey);
  const fieldByContentId = new Map(fieldsForPage.map((f) => [f.contentId, f] as const));
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const field = fieldByContentId.get(key);
    if (!field || typeof value !== "string") continue;
    const clean = sanitizeByMode(getRichTextMode(field), value);
    sanitized[key] = enforceMaxLength(clean, field.maxLength);
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

  const published = await getPageBaseContent(pageKey);
  return NextResponse.json({ ok: true, fields: extractFieldValues(pageKey, published) });
}
