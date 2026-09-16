"use client";

import { useState } from "react";
import { useEditorPreview } from "@/components/ui-builder/public/EditorPreviewContext";

// Phase 202 — the image counterpart to EditableText.tsx, same contract:
// for a normal visitor (or any non-editor-preview request) this renders
// exactly `<img src alt className />` — no wrapper, no extra attributes, no
// behavior change — so wrapping an existing hardcoded <img> in EditableImage
// is a zero-risk change to public rendering. Selection affordances (the
// outline, click-to-select, data attributes) only exist at all when
// EditorPreviewBridge has provided `enabled: true`, which only happens
// inside the admin Page Editor's iframe — never on the live public site,
// satisfying "images are visually editable/highlighted only in admin Edit
// mode, never on the public site."
//
// Unlike EditableText, clicking never edits inline — an image's "editor" is
// the Inspector's upload panel (ImageFieldInspector.tsx), not something you
// can type into. Selecting this element just posts the same
// GESA_EDITOR_SELECT_ELEMENT message EditableText does; PageEditorShell.tsx
// resolves the selected contentId to its field definition and renders the
// image panel instead of a text input for any `type: "image"` field.
//
// `fallbackSrc`/`fallbackAlt` (plain strings, not a callback) are used
// instead of an `onError` function prop passed down from the parent: this
// component is rendered from an async Server Component (DonatePage.tsx),
// and React Server Components cannot pass functions as props to a Client
// Component (they aren't serializable across that boundary) — only the
// fallback *values* can cross it, with the actual swap-on-error handled
// entirely inside this client component via local state.
export default function EditableImage({
  contentId,
  label,
  src,
  alt,
  altContentId,
  className,
  fallbackSrc,
  fallbackAlt,
  loading,
}: {
  contentId: string;
  label: string;
  src: string;
  alt: string;
  /** Phase 202 — the paired alt-text field's own contentId (see
   * pageRegistry.ts's `pairedAltContentId`). Not clickable/selectable on its
   * own — it's only here so EditorPreviewBridge's GESA_EDITOR_UPDATE_PREVIEW
   * handler can find and live-update this element's `alt` attribute when the
   * Inspector's alt-text input changes, without the alt field needing its
   * own separate canvas element. */
  altContentId?: string;
  className?: string;
  /** If the configured image URL 404s/fails to load, swap to this safe
   * fallback rather than showing a broken-image icon on the public site. */
  fallbackSrc?: string;
  fallbackAlt?: string;
  /** Phase 224 — plain passthrough to the native `<img loading>` attribute.
   * Callers below the fold (e.g. the "See the impact" gallery, the founder
   * photo) pass `"lazy"`; omitted entirely (browser default) for anything
   * likely to be above the fold, same as every hardcoded <img> on this site
   * before this prop existed. */
  loading?: "lazy" | "eager";
}) {
  const preview = useEditorPreview();
  const [failed, setFailed] = useState(false);
  const resolvedSrc = failed && fallbackSrc ? fallbackSrc : src;
  const resolvedAlt = failed && fallbackSrc ? fallbackAlt ?? alt : alt;
  const handleError = fallbackSrc ? () => setFailed(true) : undefined;

  if (!preview.enabled) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolvedSrc} alt={resolvedAlt} className={className} onError={handleError} loading={loading} />;
  }

  const isSelected = preview.selectedContentId === contentId;

  function select() {
    window.parent.postMessage({ type: "GESA_EDITOR_SELECT_ELEMENT", contentId, label }, window.location.origin);
  }

  const editModeProps = preview.editModeEnabled
    ? {
        tabIndex: 0,
        role: "button" as const,
        "aria-label": `Edit ${label}`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          select();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select();
          }
        },
        style: {
          outline: isSelected ? "2px solid var(--primary)" : "2px dashed transparent",
          outlineOffset: "2px",
          cursor: "pointer",
          transition: "outline-color 120ms ease",
        },
        onMouseEnter: (e: React.MouseEvent) => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.outlineColor = "var(--accent)";
        },
        onMouseLeave: (e: React.MouseEvent) => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.outlineColor = "transparent";
        },
      }
    : {};

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={resolvedAlt}
      className={className}
      data-gesa-content-id={contentId}
      data-gesa-alt-content-id={altContentId}
      data-gesa-label={label}
      onError={handleError}
      loading={loading}
      {...editModeProps}
    />
  );
}
