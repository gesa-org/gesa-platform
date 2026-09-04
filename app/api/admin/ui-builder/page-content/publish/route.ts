import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { getPageContent } from "@/lib/content";
import { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import { getPageDefinition } from "@/lib/ui-builder/pageRegistry";
import { applyDraftPatch } from "@/lib/ui-builder/pageContentResolver";

// Phase 133 — "Publish" for one page's text content, parallel to
// app/api/admin/ui-builder/publish/route.ts (the global theme tokens
// publish) but scoped to a single page/route. Merges the draft patch onto
// the currently published content (not a blind overwrite — this matters if
// another admin's Content Manager edit landed on a field this draft never
// touched) and writes the result back to the same site_content row the
// existing Content Manager reads/writes, then revalidates only that page's
// own route — not the whole site, since page text doesn't affect any other
// route the way a global color token does.
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

  const fallback = pageKey === "home" ? (HOME_CONTENT_FALLBACK as unknown as Record<string, unknown>) : {};
  const currentPublished = await getPageContent(def.siteContentKey, fallback);
  const merged = applyDraftPatch(pageKey, currentPublished, draftRow.schema as Record<string, unknown>);
  const publishedAt = new Date().toISOString();

  const { error: publishError } = await supabase.from("site_content").upsert(
    {
      key: def.siteContentKey,
      value: { ...merged, published: true, publishedAt, publishedBy: me.id },
    },
    { onConflict: "key" }
  );

  if (publishError) {
    return NextResponse.json({ error: "Could not publish — try again." }, { status: 500 });
  }

  revalidatePath(def.route);

  return NextResponse.json({ ok: true, publishedAt, route: def.route });
}
