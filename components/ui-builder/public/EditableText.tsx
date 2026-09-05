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
//
// Phase 134 — added the `html` prop for richText fields. `value` for those
// fields is HTML that was already sanitized twice before it ever reaches
// this component (once when saved — see app/api/admin/ui-builder/
// page-content/{draft,publish}/route.ts — and again defensively at render
// time in each page's own server component, e.g. app/page.tsx's
// `sanitizeResolvedContent` call) — this component never sanitizes
// anything itself, it only decides *how* to render an already-safe string.
// `html={false}` (the default, used by every plainText/heading/ctaLabel
// field) keeps the exact same auto-escaping `{value}` interpolation as
// before this phase existed — a value containing literal "<" characters
// always renders as visible text for those fields, never as markup.
export default function EditableText({
  contentId,
  label,
  value,
  as = "span",
  className,
  html = false,
}: {
  contentId: string;
  label: string;
  value: string;
  as?: Tag;
  className?: string;
  html?: boolean;
}) {
  const preview = useEditorPreview();
  const Tag = as;

  if (!preview.enabled) {
    if (html) {
      return <Tag className={className ? `${className} gesa-rich-content` : "gesa-rich-content"} dangerouslySetInnerHTML={{ __html: value }} />;
    }
    return <Tag className={className}>{value}</Tag>;
  }

  const isSelected = preview.selectedContentId === contentId;

  function select() {
    window.parent.postMessage(
      { type: "GESA_EDITOR_SELECT_ELEMENT", contentId, label },
      window.location.origin
    );
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

  // `data-gesa-html` tells EditorPreviewBridge's GESA_EDITOR_UPDATE_PREVIEW
  // handler whether to apply a live edit via `textContent` (plain fields —
  // so a literal "<" an admin types never gets interpreted as markup mid-
  // edit) or `innerHTML` (richText fields, whose value is already
  // sanitized HTML by the time it's posted from the inspector).
  if (html) {
    return (
      <Tag
        className={className ? `${className} gesa-rich-content` : "gesa-rich-content"}
        data-gesa-content-id={contentId}
        data-gesa-label={label}
        data-gesa-html="true"
        dangerouslySetInnerHTML={{ __html: value }}
        {...editModeProps}
      />
    );
  }

  return (
    <Tag className={className} data-gesa-content-id={contentId} data-gesa-label={label} {...editModeProps}>
      {value}
    </Tag>
  );
}
