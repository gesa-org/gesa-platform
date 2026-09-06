"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EditorPreviewContext } from "@/components/ui-builder/public/EditorPreviewContext";

// Phase 133 — mounted exactly once, only by a page whose server component
// already confirmed `?editorPreview=true` AND an authenticated admin
// session (see app/page.tsx) — never mounted for a normal visitor. This is
// the iframe-side half of the typed postMessage protocol the spec calls
// for; app/admin/ui-builder/PageEditorShell.tsx (parent frame) is the other
// half.
//
// Origin checks: every inbound message is checked against
// window.location.origin before its payload is trusted at all — this app
// has one origin for both the admin UI and the public site, so "same
// origin as this page" is the correct, simplest check (no cross-domain
// preview exists). Outbound messages are always posted with that same
// explicit targetOrigin, never "*".
type InboundMessage =
  | { type: "GESA_EDITOR_SET_EDIT_MODE"; enabled: boolean }
  | { type: "GESA_EDITOR_UPDATE_PREVIEW"; contentId: string; value: string }
  | { type: "GESA_EDITOR_SCROLL_TO_ELEMENT"; contentId: string }
  | { type: "GESA_EDITOR_SET_SELECTION"; contentId: string | null };

// Root-cause fix — "Edit mode: On is unreliable" bug report. The vast
// majority of registered contentIds (every Header/Footer nav link, every
// CTA label, the About Hero's two CTAs, etc.) render their EditableText
// span *inside* an `<a>`/`<Link>`/submit `<button>` — completely normal,
// since a CTA label's text lives inside the button that IS the CTA. The
// click-suppression listener below used to call `event.stopPropagation()`
// unconditionally on capture for any such click, and a capture-phase
// `stopPropagation()` halts the ENTIRE remaining dispatch path — including
// the rest of the capture descent AND the whole bubble phase back up
// through the actual click target — before EditableText's own bubble-phase
// `onClick` (which does the real `select()`/postMessage work) ever ran.
// That silently broke click-to-select for every one of those fields, while
// leaving fields that happen to sit in a plain `<span>` (not inside a
// link/button) working fine — exactly the "some texts are clickable, some
// aren't" symptom reported, not a per-page bug.
function isEditableTarget(el: EventTarget | null): boolean {
  return Boolean((el as HTMLElement | null)?.closest?.("[data-gesa-content-id]"));
}

function isInboundMessage(data: unknown): data is InboundMessage {
  return Boolean(data && typeof data === "object" && "type" in data && typeof (data as { type: unknown }).type === "string");
}

export default function EditorPreviewBridge({ children }: { children: ReactNode }) {
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  useEffect(() => {
    // Tell the parent frame this preview finished mounting and is ready to
    // receive selection/update messages.
    window.parent.postMessage({ type: "GESA_EDITOR_READY" }, window.location.origin);

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!isInboundMessage(event.data)) return;
      const data = event.data;
      if (data.type === "GESA_EDITOR_SET_EDIT_MODE") {
        setEditModeEnabled(data.enabled);
      } else if (data.type === "GESA_EDITOR_SET_SELECTION") {
        setSelectedContentId(data.contentId);
      } else if (data.type === "GESA_EDITOR_UPDATE_PREVIEW") {
        // Imperative, targeted DOM write on the one element matching a
        // registered contentId. Plain fields (the vast majority) always use
        // textContent, so a literal "<" an admin types mid-edit is never
        // interpreted as markup. Only an element EditableText itself
        // rendered with `data-gesa-html="true"` (a richText field) uses
        // innerHTML — and by the time this message is sent, that value was
        // already sanitized through the toolbar's allowlist in
        // RichTextEditor's onUpdate, the same sanitizer the save/publish
        // API routes re-run server-side.
        const el = document.querySelector<HTMLElement>(`[data-gesa-content-id="${CSS.escape(data.contentId)}"]`);
        if (el) {
          if (el.dataset.gesaHtml === "true") {
            el.innerHTML = data.value;
          } else {
            el.textContent = data.value;
          }
        }
      } else if (data.type === "GESA_EDITOR_SCROLL_TO_ELEMENT") {
        const el = document.querySelector(`[data-gesa-content-id="${CSS.escape(data.contentId)}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    window.addEventListener("message", onMessage);

    // Spec: "Prevent default navigation, form submission, and external
    // actions" inside the editor preview, regardless of edit-mode state —
    // an admin clicking a real link/CTA while browsing the preview should
    // never leave the builder or fire a real submission. Capture phase so
    // this runs before the target's own handlers.
    //
    // `preventDefault()` alone already stops the browser's real navigation/
    // submission — it does NOT require also calling `stopPropagation()` to
    // do that job. `stopPropagation()` is only still called when the click
    // did NOT land on a registered editable field, so a plain decorative
    // link/button inside the preview still can't fire any other page-level
    // click handler either. When the click DID land on (or inside) an
    // EditableText element, propagation is left alone so that element's own
    // bubble-phase `onClick` — which does its own preventDefault/
    // stopPropagation when edit mode is on, and does nothing at all when
    // edit mode is off — still gets to run. See `isEditableTarget` above.
    function onClickCapture(event: Event) {
      const eventTarget = event.target as HTMLElement | null;
      const target = eventTarget?.closest("a, button[type='submit'], form");
      if (!target) return;
      event.preventDefault();
      if (!isEditableTarget(eventTarget)) {
        event.stopPropagation();
      }
    }
    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("submit", onClickCapture, true);

    // Spec: "Add Escape behavior to clear the current selection without
    // losing draft changes." Keyboard focus after a canvas click stays
    // inside this iframe's own document, so the parent admin page's own
    // keydown listeners (added alongside this one in PageEditorShell.tsx,
    // for when focus is in the admin chrome instead) never see this
    // keypress — it has to be caught here and relayed up. Clearing
    // `selectedContentId` only clears *which* field is selected; it never
    // touches `crm_ui_drafts` or any saved field value, so no draft change
    // is lost.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSelectedContentId(null);
      window.parent.postMessage({ type: "GESA_EDITOR_CLEAR_SELECTION" }, window.location.origin);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("submit", onClickCapture, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <EditorPreviewContext.Provider value={{ enabled: true, editModeEnabled, selectedContentId }}>
      {children}
    </EditorPreviewContext.Provider>
  );
}
