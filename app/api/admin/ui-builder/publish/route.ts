import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { mergeDesignTokens, type DesignTokens } from "@/lib/ui-builder/types";

// Phase 132 — "Publish" for the admin UI Builder. Reads the current draft
// out of crm_ui_drafts and copies it into site_content under key
// "theme_tokens" with published: true — the same read contract every other
// page already uses (lib/content.ts's getPageContent), so no new fetch path
// was needed on the render side (see app/layout.tsx).
//
// "Flushes any CDN/server caches" (per the requested architecture) maps
// concretely to Next.js's own revalidatePath — this app has no separate
// CDN layer in front of Vercel to flush; revalidatePath("/", "layout")
// invalidates the cached render for every route nested under the root
// layout, i.e. the whole site, in one call, since the design tokens are
// injected once in app/layout.tsx and apply everywhere. This is the first
// use of revalidatePath in this codebase — every prior content edit relied
// on each page's own short ISR window (30-300s) to pick up a change instead
// of an explicit flush; Publish here is instant because the token change is
// global, not per-page.
const SCOPE = "global";

export async function POST() {
  const me = await getCurrentProfile();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (me.role !== "admin") {
    return NextResponse.json({ error: "Only administrators can publish design changes." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: draftRow, error: draftError } = await supabase
    .from("crm_ui_drafts")
    .select("schema")
    .eq("scope", SCOPE)
    .maybeSingle();

  if (draftError) {
    return NextResponse.json({ error: "Could not load the draft to publish." }, { status: 500 });
  }
  if (!draftRow?.schema) {
    return NextResponse.json({ error: "Nothing to publish — no draft changes yet." }, { status: 400 });
  }

  const tokens = mergeDesignTokens(draftRow.schema as Partial<DesignTokens>);
  const publishedAt = new Date().toISOString();

  const { error: publishError } = await supabase.from("site_content").upsert(
    {
      key: "theme_tokens",
      value: { ...tokens, published: true, publishedAt, publishedBy: me.id },
    },
    { onConflict: "key" }
  );

  if (publishError) {
    return NextResponse.json({ error: "Could not publish — try again." }, { status: 500 });
  }

  // Whole-site cache flush — see comment above for why root/"layout" is the
  // right granularity for a global token change.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, publishedAt, tokens });
}
