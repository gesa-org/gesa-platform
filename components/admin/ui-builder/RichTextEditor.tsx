"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import RichTextToolbar from "@/components/admin/ui-builder/RichTextToolbar";
import { sanitizeRichTextHtml, sanitizeInlineRichTextHtml } from "@/lib/ui-builder/sanitizeRichText";
import { TextStyle, Superscript, Subscript } from "@/components/admin/ui-builder/richTextFontExtensions";

// Phase 134 — the reusable Tiptap-backed editor, now (Phase 137) shared by
// every text-based Page Content field, not just "richText"-typed ones —
// see lib/ui-builder/pageRegistry.ts's getRichTextMode for what decides a
// field's `mode`. Only ever imported by the admin Page Editor's inspector
// (components/admin/ui-builder/PageEditorShell.tsx) — never by any public
// page — so Tiptap's ~40kb never ships in the public bundle, matching the
// "do not bundle admin editor dependencies into public pages" requirement.
//
// The editor's own extension set is deliberately narrower than Tiptap's
// full StarterKit default: `link` is replaced with a configured instance
// (safe protocols only, `openOnClick: false` so clicking a link while
// editing doesn't navigate away). This mirrors
// lib/ui-builder/sanitizeRichText.ts's own allowlist on the persistence
// side; the two are meant to allow exactly the same set of marks/nodes.
//
// Phase 137 — `mode="inline"` (headings, CTA/form labels, short plainText
// badges/eyebrows — fields that render inside a tag the page template
// already supplies) disables the heading/list/blockquote/horizontal-rule
// nodes and skips the alignment extension entirely, at the Tiptap schema
// level — not just hiding the matching toolbar buttons (RichTextToolbar's
// own `mode` prop does that too, as a second, independent layer) and not
// just relying on lib/ui-builder/sanitizeRichText.ts's inline sanitizer to
// strip them at save time (a third layer). All three exist because any one
// of them alone would still leave a path to invalid nested markup — a
// keyboard shortcut bypassing a hidden button, a paste bypassing a
// disabled schema node, or a sanitizer bug bypassing both.
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter and format your content…",
  mode = "block",
  maxLength,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  mode?: "block" | "inline";
  maxLength?: number;
}) {
  const isBlock = mode === "block";
  const sanitize = isBlock ? sanitizeRichTextHtml : sanitizeInlineRichTextHtml;

  // Phase 137 — the server (both draft PUT and publish POST routes) enforces
  // maxLength too, but this is what gives an admin the same in-the-moment
  // "you can't type past the limit" feedback a plain <input maxLength> has
  // always given for these fields. Tiptap has no built-in equivalent, so
  // this reverts to the last accepted content whenever an edit would push
  // the plain-text length over the limit — the same "stop the keystroke"
  // feel as a native input, rather than silently truncating mid-edit.
  const lastGoodHtmlRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Headings are allowed (H1-H3, per the toolbar's paragraph-style
        // selector) only in "block" mode — code blocks/inline code aren't
        // part of this toolbar at all, so they're switched off regardless
        // of mode.
        heading: isBlock ? { levels: [1, 2, 3] } : false,
        codeBlock: false,
        code: false,
        bulletList: isBlock ? undefined : false,
        orderedList: isBlock ? undefined : false,
        blockquote: isBlock ? undefined : false,
        horizontalRule: isBlock ? undefined : false,
      }),
      Underline,
      // Phase 136 — the Font ribbon group (family/size/color/highlight/
      // small-caps/all-caps share the one TextStyle mark; superscript/
      // subscript are their own real <sup>/<sub> marks). See
      // richTextFontExtensions.ts for why these are built in-house on top
      // of the already-installed @tiptap/extension-text-style rather than
      // three more small npm packages.
      TextStyle,
      Superscript,
      Subscript,
      ...(isBlock ? [TextAlign.configure({ types: ["heading", "paragraph"] })] : []),
      Link.configure({
        openOnClick: false,
        autolink: false,
        protocols: ["http", "https", "mailto", "tel"],
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "gesa-rte-content min-h-[220px] px-3 py-2.5 text-[14px] leading-relaxed outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (maxLength != null && e.getText().length > maxLength) {
        e.commands.setContent(lastGoodHtmlRef.current, false);
        return;
      }
      const clean = sanitize(e.getHTML());
      lastGoodHtmlRef.current = clean;
      onChange(clean);
    },
  });

  // Keeps the editor in sync when the *selected field* changes out from
  // under it (switching Layers selection, or a Discard) — Tiptap is
  // otherwise uncontrolled after mount, so this is the one place external
  // value changes need to be pushed back in.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    lastGoodHtmlRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <RichTextToolbar editor={editor} mode={mode} />
      <div className="max-h-[360px] overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
