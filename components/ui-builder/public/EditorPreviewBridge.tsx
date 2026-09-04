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
        // Imperative, targeted DOM write — only ever sets textContent
        // (never innerHTML) on the one element matching a registered
        // contentId, so a malformed/unexpected message can't inject markup.
        const el = document.querySelector(`[data-gesa-content-id="${CSS.escape(data.contentId)}"]`);
        if (el) el.textContent = data.value;
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
    function onClickCapture(event: Event) {
      const target = (event.target as HTMLElement | null)?.closest("a, button[type='submit'], form");
      if (target) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("submit", onClickCapture, true);

    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("submit", onClickCapture, true);
    };
  }, []);

  return (
    <EditorPreviewContext.Provider value={{ enabled: true, editModeEnabled, selectedContentId }}>
      {children}
    </EditorPreviewContext.Provider>
  );
}
