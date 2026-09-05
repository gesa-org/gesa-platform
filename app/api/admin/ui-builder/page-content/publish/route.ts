import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { getPageDefinition, getEditableFields, getRichTextMode } from "@/lib/ui-builder/pageRegistry";
import { applyDraftPatch, getPageBaseContent, publishPageSources, sanitizeByMode } from "@/lib/ui-builder/pageContentResolver";
import { enforceMaxLength } from "@/lib/ui-builder/enforceMaxLength";

// Phase 133 — "Publish" for one page's text content, parallel to
// app/api/admin/ui-builder/publish/route.ts (the global theme tokens
// publish) but scoped to a single page/route. Merges the draft patch onto
// the currently published content (not a blind overwrite — this matters if
// another admin's Content Manager edit landed on a field this draft never
// touched) and writes the result back to the same site_content row(s) the
// existing Content Manager reads/writes, then revalidates only that page's
// own route — not the whole site, since page text doesn't affect any other
// route the way a global color token does.
//
// Phase 135 — generalized to publishPageSources(), which fans a page's
// resolved content back out across every one of its `contentSources`
// (About writes two site_content rows, for example) instead of this route
// assuming exactly one row per page.
export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can publish page content." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const pageKey = (body?.pageKey as string | undefined) ?? "";
  const def = getPageDefinition(pageKey);
  if (!def || !def.supportsVisualEditor) {
    return NextResponse.json({ error: "This page doesn't support the visual editor yet." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: draftRow, error: draftError } = await supabase
    .from("crm_ui_drafts")
    .select("schema")
    .eq("scope", `page:${pageKey}`)
    .maybeSingle();

  if (draftError) {
    return NextResponse.json({ error: "Could not load the draft to publish." }, { status: 500 });
  }
  if (!draftRow?.schema || Object.keys(draftRow.schema as object).length === 0) {
    return NextResponse.json({ error: "Nothing to publish — no draft changes yet." }, { status: 400 });
  }

  // Defense in depth — the draft was already sanitized at PUT time
  // (app/api/admin/ui-builder/page-content/draft/route.ts), but Publish
  // re-sanitizes per field type here too rather than trusting the stored
  // draft blindly, so a row written by some future/other code path can
  // never reach the public site unsanitized.
  const fieldByContentId = new Map(getEditableFields(pageKey).map((f) => [f.contentId, f] as const));
  const rawPatch = draftRow.schema as Record<string, unknown>;
  const sanitizedPatch: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawPatch)) {
    const field = fieldByContentId.get(key);
    if (!field || typeof value !== "string") continue;
    const clean = sanitizeByMode(getRichTextMode(field), value);
    sanitizedPatch[key] = enforceMaxLength(clean, field.maxLength);
  }

  const currentPublished = await getPageBaseContent(pageKey);
  const merged = applyDraftPatch(pageKey, currentPublished, sanitizedPatch);
  const publishedAt = new Date().toISOString();

  const publishResult = await publishPageSources(pageKey, merged, me.id);
  if (!publishResult.ok) {
    return NextResponse.json({ error: publishResult.error }, { status: 500 });
  }

  revalidatePath(def.route);

  return NextResponse.json({ ok: true, publishedAt, route: def.route });
}
