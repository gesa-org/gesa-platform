import { getSiteContent } from "@/lib/queries";
import { getPageContent, ABOUT_SECTIONS_FALLBACK, THERAPISTS_CONTENT_FALLBACK, SUPPORT_GROUPS_CONTENT_FALLBACK, FAQ_CONTENT_FALLBACK, CONTACT_CONTENT_FALLBACK } from "@/lib/content";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { HOME_CONTENT_FALLBACK } from "@/components/home/Paths";
import { HERO_CONTENT_FALLBACK } from "@/components/Hero";
import { THERAPISTS_DIRECTORY_CONTENT_FALLBACK } from "@/components/TherapistsDirectory";
import { SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK } from "@/components/SupportGroupsInteractive";
import { COMMUNITY_INTRO_FALLBACK } from "@/components/support-groups/CommunityIntro";
import { DONATE_PAGE_FALLBACK } from "@/components/donate/DonatePage";
import { INTAKE_FLOW_CONTENT_FALLBACK } from "@/app/intake/intakeContent";
import { getPageDefinition } from "@/lib/ui-builder/pageRegistry";
import { getEditableFields, isRichTextField } from "@/lib/ui-builder/pageRegistry";
import { sanitizeRichTextHtml, stripAllHtml } from "@/lib/ui-builder/sanitizeRichText";

// Phase 135 — one fallback object per site_content key, so the generic
// multi-source read/write helpers below (getPageBaseContent,
// publishPageSources) don't need a per-pageKey switch statement the way
// Phase 133's single-source `getFallbackForPage` did. Every fallback here
// is the exact same exported const each page's own component already
// imports and renders with — this is the same "one source of truth for
// what the site looks like with no admin edits yet" object, not a second
// copy that could drift.
const FALLBACK_BY_SITE_CONTENT_KEY: Record<string, Record<string, unknown>> = {
  page_home: HOME_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  page_about_hero: HERO_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  page_about_sections: ABOUT_SECTIONS_FALLBACK as unknown as Record<string, unknown>,
  page_therapists: THERAPISTS_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  component_therapists_directory: THERAPISTS_DIRECTORY_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  page_support_groups: SUPPORT_GROUPS_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  component_support_groups_directory: SUPPORT_GROUPS_DIRECTORY_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  component_community_intro: COMMUNITY_INTRO_FALLBACK as unknown as Record<string, unknown>,
  page_donate: DONATE_PAGE_FALLBACK as unknown as Record<string, unknown>,
  component_intake_flow: INTAKE_FLOW_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  page_faq: FAQ_CONTENT_FALLBACK as unknown as Record<string, unknown>,
  page_contact: CONTACT_CONTENT_FALLBACK as unknown as Record<string, unknown>,
};

// Phase 133 — resolves a page's content the way the spec's section 8C asks:
//   Public rendering:      published override -> component default
//   Editor preview:        in-memory unsaved change -> draft -> published -> default
// "Published override" and "component default" already exist exactly this
// way via lib/content.ts's getPageContent() (published site_content row, or
// the page's hardcoded HomeContent fallback) — this module only adds the
// draft layer on top, for admin preview only, via crm_ui_drafts.
//
// Draft rows are keyed `scope = "page:<pageKey>"` in the same crm_ui_drafts
// table Phase 132 created for the global theme builder — reusing it rather
// than a parallel `ui_builder_content_overrides` table, since the shape it
// already has (scope, schema jsonb, updated_by, updated_at) fits a
// per-page content draft exactly as well as it fits the theme-token draft.

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split(".");
  const result: Record<string, unknown> = { ...obj };
  let cursor = result;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      cursor[key] = value;
    } else {
      const next = { ...(cursor[key] as Record<string, unknown> | undefined) };
      cursor[key] = next;
      cursor = next;
    }
  });
  return result;
}

/** Applies a flat `{ contentId: value }` draft patch onto a page's resolved
 * content object, using each field's registered `path`. Unknown contentIds
 * (not in the registry for this page) are silently skipped — this is the
 * "admin cannot write arbitrary unknown fields" guard applied on read; the
 * API routes apply the same guard on write (see page-content/draft/route.ts). */
export function applyDraftPatch<T extends Record<string, unknown>>(
  pageKey: string,
  base: T,
  patch: Record<string, unknown> | null | undefined
): T {
  if (!patch) return base;
  const fields = getEditableFields(pageKey);
  let result: Record<string, unknown> = { ...base };
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(patch, field.contentId)) {
      result = setAtPath(result, field.path, patch[field.contentId]);
    }
  }
  return result as T;
}

/** Reads the current value of every registered field out of a resolved
 * content object, keyed by contentId — the shape the admin inspector reads
 * from and the draft API persists. */
export function extractFieldValues(pageKey: string, content: Record<string, unknown>): Record<string, string> {
  const fields = getEditableFields(pageKey);
  const out: Record<string, string> = {};
  for (const field of fields) {
    const value = getAtPath(content, field.path);
    out[field.contentId] = typeof value === "string" ? value : "";
  }
  return out;
}

/** Phase 134 — defense-in-depth sanitization applied at render time, on top
 * of the sanitization already done when a field is saved (see
 * app/api/admin/ui-builder/page-content/draft/route.ts and .../publish/
 * route.ts). Re-sanitizes every registered field on a resolved content
 * object per its type — richText fields through the toolbar's HTML
 * allowlist, everything else stripped of any HTML entirely — so a row that
 * somehow predates this phase, or was edited directly in the database,
 * still can't reach a visitor unsanitized. Idempotent: sanitizing
 * already-clean content is a no-op, so calling this on every request is
 * cheap and safe. */
export function sanitizeResolvedContent<T extends Record<string, unknown>>(pageKey: string, content: T): T {
  const fields = getEditableFields(pageKey);
  let result: Record<string, unknown> = { ...content };
  for (const field of fields) {
    const value = getAtPath(result, field.path);
    if (typeof value !== "string") continue;
    const clean = isRichTextField(field.type) ? sanitizeRichTextHtml(value) : stripAllHtml(value);
    result = setAtPath(result, field.path, clean);
  }
  return result as T;
}

/** Phase 135 — fetches and merges every `site_content` row a page's
 * registry lists under `contentSources`, nesting each under its namespace
 * (namespace "" spreads at the top level — this is exactly what Home's
 * page.tsx did by hand before this phase, generalized so the admin API
 * routes don't need a per-page switch statement). Used by the draft/publish
 * API routes; each page's own page.tsx still fetches its content the way
 * it always has (unchanged), since it already knows its own precise types —
 * this generic, loosely-typed version is only for the admin endpoints,
 * which only ever need to read/patch by string path anyway. */
export async function getPageBaseContent(pageKey: string): Promise<Record<string, unknown>> {
  const def = getPageDefinition(pageKey);
  if (!def) return {};
  let result: Record<string, unknown> = {};
  for (const source of def.contentSources) {
    const fallback = FALLBACK_BY_SITE_CONTENT_KEY[source.siteContentKey] ?? {};
    const value = await getPageContent(source.siteContentKey, fallback);
    result = source.namespace === "" ? { ...result, ...value } : { ...result, [source.namespace]: value };
  }
  return result;
}

/** Phase 135 — the write-side counterpart: splits a resolved (patched)
 * content object back apart by namespace and upserts each piece into its
 * own `site_content` row — the same row the existing Content Manager reads
 * and writes, so an edit published from either interface is immediately
 * visible in the other with no migration or second data store involved.
 * `revalidatePath` is left to the caller (the publish route), since only it
 * knows the page's route. */
export async function publishPageSources(
  pageKey: string,
  resolved: Record<string, unknown>,
  publishedBy: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const def = getPageDefinition(pageKey);
  if (!def || def.contentSources.length === 0) {
    return { ok: false, error: "This page has no publishable content sources." };
  }
  const supabase = await createClient();
  const publishedAt = new Date().toISOString();
  for (const source of def.contentSources) {
    const value = source.namespace === "" ? resolved : (resolved[source.namespace] as Record<string, unknown> | undefined) ?? {};
    const { error } = await supabase.from("site_content").upsert(
      { key: source.siteContentKey, value: { ...value, published: true, publishedAt, publishedBy } },
      { onConflict: "key" }
    );
    if (error) return { ok: false, error: "Could not publish — try again." };
  }
  return { ok: true };
}

// Phase 135 — the one function every visual-editor-enabled page's own
// page.tsx calls, replacing the bespoke "check searchParams, check admin,
// fetch crm_ui_drafts, applyDraftPatch" block that used to live only in
// app/page.tsx (Home). Takes the page's already-fetched, already-merged
// base content object (built however that page normally builds it — one
// getPageContent() call for a single-source page, several merged under
// their namespaces for a multi-source page like About) and layers the
// same draft-then-sanitize resolution every page now shares:
//   Public rendering:      published override -> component default
//   Editor preview:        in-memory unsaved change -> draft -> published -> default
// "Published override"/"component default" already exist via each page's
// own getPageContent() calls (unchanged) — this only adds the draft layer
// on top for an authenticated admin's preview, and applies the Phase 134
// defense-in-depth sanitization pass unconditionally, for every page that
// has a field registry, not just Home.
export async function resolveEditorPreview<T extends Record<string, unknown>>(
  pageKey: string,
  base: T,
  searchParams: { [key: string]: string | string[] | undefined } | undefined
): Promise<{ resolved: T; isEditorPreview: boolean }> {
  const wantsPreview = searchParams?.editorPreview === "true";
  if (!wantsPreview) {
    return { resolved: sanitizeResolvedContent(pageKey, base), isEditorPreview: false };
  }

  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    // Same guard Home's page.tsx always had: a logged-out visitor (or a
    // logged-in non-admin) guessing the query string gets the normal
    // published-only page, never draft content.
    return { resolved: sanitizeResolvedContent(pageKey, base), isEditorPreview: false };
  }

  const supabase = await createClient();
  const { data: draftRow } = await supabase
    .from("crm_ui_drafts")
    .select("schema")
    .eq("scope", `page:${pageKey}`)
    .maybeSingle();

  const patched = applyDraftPatch(pageKey, base, (draftRow?.schema as Record<string, unknown> | null) ?? null);
  return { resolved: sanitizeResolvedContent(pageKey, patched) as T, isEditorPreview: true };
}

// Re-exported so callers only need one import for the "what does this page
// currently publish under" question, matching getPageContent's own generic
// contract (fallback object typed by the caller).
export { getSiteContent };
