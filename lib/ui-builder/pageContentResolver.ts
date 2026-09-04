import { getSiteContent } from "@/lib/queries";
import { getEditableFields } from "@/lib/ui-builder/pageRegistry";

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

// Re-exported so callers only need one import for the "what does this page
// currently publish under" question, matching getPageContent's own generic
// contract (fallback object typed by the caller).
export { getSiteContent };
