import { stripAllHtml } from "@/lib/ui-builder/sanitizeRichText";

// Phase 137 — server-side backstop for a field's character limit, behind
// RichTextEditor.tsx's own client-side revert-on-exceed (see that file's
// `maxLength` prop). The client-side guard should mean this almost never
// fires in normal use; it exists for hand-crafted requests, drafts saved
// before a field's limit existed or changed, and any other path that
// doesn't go through the real inspector UI.
//
// A 400 rejection would be the wrong failure mode here: this route backs
// an autosaving draft field, and the admin could be mid-sentence when a
// debounced save fires. Instead, over-limit content is flattened to plain
// text (losing formatting, not content) and hard-truncated to the limit —
// a visibly different, safe fallback rather than a silent no-op or a
// failed autosave the admin never notices.
export function enforceMaxLength(html: string, maxLength: number | undefined): string {
  if (maxLength == null) return html;
  const plain = stripAllHtml(html);
  if (plain.length <= maxLength) return html;
  return plain.slice(0, maxLength);
}
