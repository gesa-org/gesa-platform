import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";

// Phase 236 — shared save path for every site_content-backed Content
// Manager editor. Previously each editor (FlatFieldsEditor, SimplePageEditor,
// HeroEditor — the only three that write site_content directly; every other
// editor in components/admin/content/ is a thin wrapper around one of these)
// called `supabase.from("site_content").upsert(...)` on its own, so there
// was no single place recording *who* changed a page or *when*, and no way
// to see or restore a previous version — exactly the "Website Pages"
// directory / version-history gap Roy asked to close. Centralizing the save
// here means every editor gets real "last updated by," a full audit trail,
// and restore, with zero change to each editor's own field UI.
//
// This does not change the underlying publish model: site_content still
// holds exactly one live row per key (see lib/content.ts), and saving here
// still writes straight to it — there is no separate draft-staging table for
// these classic editors (that already exists, separately, for UI Builder's
// page-content overlay via crm_ui_drafts). Each content shape's own
// `published` boolean is still what a public page checks before rendering
// the saved value vs. its built-in fallback (see SimplePageEditor.tsx's own
// note on this) — `saveContent` just also logs the resulting state as a new
// content_versions row after every save. This is deliberately scoped to the
// audit-trail need behind the Website Pages directory (Phase 236), not a
// second attempt at true draft-staging for these editors — see
// EXECUTION_PLAN.md Phase 236 for that scoping decision.
export async function saveContent(
  contentKey: string,
  value: Record<string, unknown> & { published?: boolean }
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error: upsertError } = await supabase
    .from("site_content")
    .upsert({ key: contentKey, value: value as Json }, { onConflict: "key" });

  if (upsertError) {
    return { error: upsertError.message };
  }

  // Best-effort: a failed version-log insert should never make the actual
  // content save look like it failed — the save already succeeded above.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("content_versions").insert({
      content_key: contentKey,
      action: value.published === false ? "unpublished" : "published",
      snapshot: value as Json,
      editor_id: user?.id ?? null,
      editor_email: user?.email ?? null,
    });
  } catch {
    // Swallowed intentionally — see comment above.
  }

  return { error: null };
}
