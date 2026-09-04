"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Link2Off,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import LinkEditorPopover, { type LinkPopoverValue } from "@/components/admin/ui-builder/LinkEditorPopover";

// Phase 134 — the Word-style formatting toolbar for richText fields.
// Sticky at the top of the editor panel (the parent, RichTextEditor.tsx,
// positions this) so it stays visible while long content scrolls. Every
// button is a real <button> with an aria-pressed active state and a title
// tooltip, keyboard-reachable in normal tab order — no custom widgets that
// would need their own roving-tabindex implementation.
function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 flex-none items-center justify-center rounded-md transition-colors ${
        active ? "bg-primary text-primary-fg" : "text-muted-fg hover:bg-secondary/60 hover:text-foreground"
      } disabled:pointer-events-none disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px flex-none bg-border" aria-hidden="true" />;
}

export default function RichTextToolbar({ editor }: { editor: Editor }) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

  const paragraphStyle = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  function setParagraphStyle(value: string) {
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = Number(value.replace("h", "")) as 1 | 2 | 3;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  }

  function openLinkPopover() {
    setLinkPopoverOpen(true);
  }

  // Ctrl/Cmd+K — the one toolbar shortcut Tiptap's built-in extensions
  // don't already bind (Bold/Italic/Underline/Strike/Undo/Redo all come
  // with their own Mod- shortcuts from StarterKit/Underline out of the
  // box). Bound on the editor's own DOM node so it only fires while the
  // rich-text area itself has focus.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openLinkPopover();
      }
    }
    const dom = editor.view.dom;
    dom.addEventListener("keydown", onKeyDown);
    return () => dom.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  function currentLinkValue(): LinkPopoverValue {
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ");
    const existingHref = editor.getAttributes("link").href as string | undefined;
    const existingTarget = editor.getAttributes("link").target as string | undefined;
    return { text: selectedText, url: existingHref ?? "", openInNewTab: existingTarget === "_blank" };
  }

  function handleSaveLink(value: LinkPopoverValue) {
    const { empty } = editor.state.selection;
    const attrs = value.openInNewTab ? { href: value.url, target: "_blank", rel: "noopener noreferrer" } : { href: value.url };
    if (empty) {
      // No selection — insert the link text as new content, matching a
      // normal Word "Insert Hyperlink with no selection" experience.
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: value.text, marks: [{ type: "link", attrs }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
    }
    setLinkPopoverOpen(false);
  }

  function handleRemoveLink() {
    editor.chain().focus().unsetLink().run();
    setLinkPopoverOpen(false);
  }

  const hasExistingLink = editor.isActive("link");

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-border bg-card px-2 py-1.5"
    >
      <select
        aria-label="Paragraph style"
        value={paragraphStyle}
        onChange={(e) => setParagraphStyle(e.target.value)}
        className="mr-1 rounded-md border border-border bg-transparent px-1.5 py-1 text-[12px]"
      >
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <Divider />

      <ToolbarButton label="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton label="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline size={14} />
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={14} />
      </ToolbarButton>
      <Divider />

      <ToolbarButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={14} />
      </ToolbarButton>
      <Divider />

      <ToolbarButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft size={14} />
      </ToolbarButton>
      <ToolbarButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter size={14} />
      </ToolbarButton>
      <ToolbarButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight size={14} />
      </ToolbarButton>
      <Divider />

      <ToolbarButton label="Insert/edit link (Ctrl+K)" active={hasExistingLink} onClick={openLinkPopover}>
        <Link2 size={14} />
      </ToolbarButton>
      {hasExistingLink && (
        <ToolbarButton label="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
          <Link2Off size={14} />
        </ToolbarButton>
      )}
      <ToolbarButton label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton label="Horizontal divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={14} />
      </ToolbarButton>
      <Divider />

      <ToolbarButton label="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={14} />
      </ToolbarButton>
      <ToolbarButton label="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={14} />
      </ToolbarButton>
      <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        <Eraser size={14} />
      </ToolbarButton>

      {linkPopoverOpen && (
        <LinkEditorPopover
          initial={currentLinkValue()}
          hasExistingLink={hasExistingLink}
          onSave={handleSaveLink}
          onRemove={handleRemoveLink}
          onClose={() => setLinkPopoverOpen(false)}
        />
      )}
    </div>
  );
}
