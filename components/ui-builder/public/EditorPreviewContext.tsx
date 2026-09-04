"use client";

import { createContext, useContext } from "react";

// Phase 133 — the switch that lets EditableText (and future EditableButton/
// EditableImage) render two ways from one component: a normal visitor gets
// exactly the plain text/markup that was there before this phase (this
// context's default, `{ enabled: false }`, applies with zero provider in
// the tree — no extra DOM, no extra JS behavior, no risk to public
// rendering), while the admin Page Editor's iframe gets the same markup
// plus selection affordances. Only EditorPreviewBridge (mounted once, only
// when app/page.tsx's server-side gate confirms `editorPreview=true` AND an
// authenticated admin) ever provides a `{ enabled: true }` value.
export type EditorPreviewState = {
  enabled: boolean;
  /** True only once the Page Editor's parent frame has toggled "Edit mode"
   * on — hover outlines and click-to-select are gated on this, not just
   * `enabled`, so a plain draft preview (edit mode off) never shows editor
   * chrome, matching the spec's "when OFF ... editable components can be
   * selected" (only when ON) requirement. */
  editModeEnabled: boolean;
  selectedContentId: string | null;
};

export const EditorPreviewContext = createContext<EditorPreviewState>({
  enabled: false,
  editModeEnabled: false,
  selectedContentId: null,
});

export function useEditorPreview() {
  return useContext(EditorPreviewContext);
}
