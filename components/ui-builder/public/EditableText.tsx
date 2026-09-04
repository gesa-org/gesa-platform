"use client";

import { useEditorPreview } from "@/components/ui-builder/public/EditorPreviewContext";

type Tag = "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";

// Phase 133 — the public-page half of the "stable content ID" contract
// (see lib/ui-builder/pageRegistry.ts). Renders exactly `<Tag>{value}</Tag>`
// for a normal visitor or a normal (non-editor-preview) request — same
// element, same text, same className, no wrapper, no extra attributes — so
// wrapping an existing element in EditableText is a zero-risk change to
// public rendering. Selection affordances (data attributes, hover/click
// handling, postMessage) only render at all when EditorPreviewBridge has
// provided `enabled: true`, which only ever happens inside the admin Page
// Editor's iframe.
export default function EditableText({
  contentId,
  label,
  value,
  as = "span",
  className,
}: {
  contentId: string;
  label: string;
  value: string;
  as?: Tag;
  className?: string;
}) {
  const preview = useEditorPreview();
  const Tag = as;

  if (!preview.enabled) {
    return <Tag className={className}>{value}</Tag>;
  }

  const isSelected = preview.selectedContentId === contentId;

  function select() {
    window.parent.postMessage(
      { type: "GESA_EDITOR_SELECT_ELEMENT", contentId, label },
      window.location.origin
    );
  }

  return (
    <Tag
      className={className}
      data-gesa-content-id={contentId}
      data-gesa-label={label}
      // Keyboard-operable selection (spec: "selection and editing work with
      // keyboard and mouse"), only wired up once edit mode is on — matches
      // hover/click also being edit-mode-gated below.
      tabIndex={preview.editModeEnabled ? 0 : undefined}
      role={preview.editModeEnabled ? "button" : undefined}
      aria-label={preview.editModeEnabled ? `Edit ${label}` : undefined}
      onClick={
        preview.editModeEnabled
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              select();
            }
          : undefined
      }
      onKeyDown={
        preview.editModeEnabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                select();
              }
            }
          : undefined
      }
      style={
        preview.editModeEnabled
          ? {
              outline: isSelected ? "2px solid var(--primary)" : "2px dashed transparent",
              outlineOffset: "2px",
              cursor: "pointer",
              transition: "outline-color 120ms ease",
            }
          : undefined
      }
      onMouseEnter={
        preview.editModeEnabled && !isSelected
          ? (e) => {
              (e.currentTarget as HTMLElement).style.outlineColor = "var(--accent)";
            }
          : undefined
      }
      onMouseLeave={
        preview.editModeEnabled && !isSelected
          ? (e) => {
              (e.currentTarget as HTMLElement).style.outlineColor = "transparent";
            }
          : undefined
      }
    >
      {value}
    </Tag>
  );
}
