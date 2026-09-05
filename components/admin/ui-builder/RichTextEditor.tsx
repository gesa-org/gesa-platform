"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import RichTextToolbar from "@/components/admin/ui-builder/RichTextToolbar";
import { sanitizeRichTextHtml } from "@/lib/ui-builder/sanitizeRichText";
import { TextStyle, Superscript, Subscript } from "@/components/admin/ui-builder/richTextFontExtensions";

// Phase 134 — the reusable Tiptap-backed editor for richText fields. Only
// ever imported by the admin Page Editor's inspector
// (components/admin/ui-builder/PageEditorShell.tsx) — never by any public
// page — so Tiptap's ~40kb never ships in the public bundle, matching the
// "do not bundle admin editor dependencies into public pages" requirement.
//
// The editor's own extension set is deliberately narrower than Tiptap's
// full StarterKit default: `link` is replaced with a configured instance
// (safe protocols only, `openOnClick: false` so clicking a link while
// editing doesn't navigate away), and StarterKit's own `link` extension (if
// any future version adds one) would conflict — see the `extensions` array
// below for the exact, intentional allowlist. This mirrors
// lib/ui-builder/sanitizeRichText.ts's own allowlist on the persistence
// side; the two are meant to allow exactly the same set of marks/nodes.
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter and format your content…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Headings are still allowed (H1-H3, per the toolbar's paragraph-
        // style selector) but code blocks/inline code aren't part of this
        // spec's toolbar, so they're switched off rather than left
        // reachable only via a markdown shortcut a content editor wouldn't
        // know exists.
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        code: false,
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
      TextAlign.configure({ types: ["heading", "paragraph"] }),
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
      onChange(sanitizeRichTextHtml(e.getHTML()));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <RichTextToolbar editor={editor} />
      <div className="max-h-[360px] overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
