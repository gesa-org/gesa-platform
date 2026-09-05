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
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Palette,
  Highlighter,
  ChevronDown,
  Settings2,
} from "lucide-react";
import LinkEditorPopover, { type LinkPopoverValue } from "@/components/admin/ui-builder/LinkEditorPopover";
import FontColorPopover from "@/components/admin/ui-builder/FontColorPopover";
import FontSettingsDialog from "@/components/admin/ui-builder/FontSettingsDialog";
import {
  RICH_TEXT_FONT_FAMILY_OPTIONS,
  RICH_TEXT_FONT_SIZE_OPTIONS,
  RICH_TEXT_COLOR_SWATCHES,
  RICH_TEXT_HIGHLIGHT_SWATCHES,
} from "@/lib/ui-builder/richTextFontOptions";

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

// Phase 136 — re-reads the shared textStyle mark's attributes fresh on
// every render (RichTextToolbar itself re-renders on every selection change
// via Tiptap's onTransaction, wired in RichTextEditor.tsx's parent — same
// as every other `editor.isActive(...)` check already used throughout this
// file), so the family/size/color/highlight controls below always reflect
// whatever's under the current cursor/selection.
function currentTextStyle(editor: Editor) {
  return editor.getAttributes("textStyle") as {
    fontFamily?: string | null;
    fontSize?: string | null;
    color?: string | null;
    backgroundColor?: string | null;
    caps?: "small" | "all" | null;
  };
}

export default function RichTextToolbar({ editor }: { editor: Editor }) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [highlightPopoverOpen, setHighlightPopoverOpen] = useState(false);
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const [fontDialogOpen, setFontDialogOpen] = useState(false);

  const textStyle = currentTextStyle(editor);

  function mergeTextStyle(patch: Partial<ReturnType<typeof currentTextStyle>>) {
    editor
      .chain()
      .focus()
      .setMark("textStyle", { ...textStyle, ...patch })
      .run();
  }

  // Phase 136 — "Aa" Change Case, matching Word's ribbon button of the same
  // name: unlike the Font dialog's Small caps/All caps (CSS-only, the
  // underlying letters are untouched — see richTextFontExtensions.ts),
  // this one actually rewrites the selected characters, exactly like
  // Word's own version does. Implemented by walking every text node inside
  // the selection and replacing its slice of text while explicitly
  // re-applying that node's own marks (bold/italic/etc. survive the
  // rewrite) — a plain `insertText` would silently drop that formatting.
  function changeCase(transform: (s: string) => string) {
    const { from, to } = editor.state.selection;
    if (from === to) {
      setCaseMenuOpen(false);
      return;
    }
    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        type MarksArg = Parameters<typeof state.schema.text>[1];
        const ranges: { start: number; end: number; text: string; marks: MarksArg }[] = [];
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText || !node.text) return;
          const start = Math.max(pos, from);
          const end = Math.min(pos + node.text.length, to);
          if (start >= end) return;
          ranges.push({ start, end, text: node.text.slice(start - pos, end - pos), marks: node.marks });
        });
        for (const r of ranges) {
          const mappedStart = tr.mapping.map(r.start);
          const mappedEnd = tr.mapping.map(r.end);
          tr.replaceWith(mappedStart, mappedEnd, state.schema.text(transform(r.text), r.marks));
        }
        return true;
      })
      .run();
    setCaseMenuOpen(false);
  }

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

      {/* Phase 136 — Font family/size, mirroring the two dropdowns at the
          left edge of Word's Font ribbon group. Curated lists (see
          lib/ui-builder/richTextFontOptions.ts) — not free text, so a
          choice here can never load a font the site doesn't already
          serve. */}
      <select
        aria-label="Font family"
        value={textStyle.fontFamily ?? ""}
        onChange={(e) => mergeTextStyle({ fontFamily: e.target.value || null })}
        className="mr-1 max-w-[130px] rounded-md border border-border bg-transparent px-1.5 py-1 text-[12px]"
      >
        {RICH_TEXT_FONT_FAMILY_OPTIONS.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Font size"
        value={textStyle.fontSize ?? ""}
        onChange={(e) => mergeTextStyle({ fontSize: e.target.value || null })}
        className="mr-1 w-[64px] rounded-md border border-border bg-transparent px-1.5 py-1 text-[12px]"
      >
        {RICH_TEXT_FONT_SIZE_OPTIONS.map((s) => (
          <option key={s.label} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* "Aa" Change Case — matches Word's own button of the same name.
          Rewrites the selected characters (see changeCase() above); a
          plain dropdown menu rather than a split-button, since none of
          these five options needs a default "last used" behavior. */}
      <div className="relative">
        <ToolbarButton label="Change case" onClick={() => setCaseMenuOpen((v) => !v)}>
          <span className="flex items-center text-[12px] font-semibold">
            Aa <ChevronDown size={11} />
          </span>
        </ToolbarButton>
        {caseMenuOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-20 mt-1 w-[170px] rounded-xl border border-border bg-card p-1 text-[12.5px] shadow-lg"
          >
            {[
              { label: "Sentence case.", fn: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() },
              { label: "lowercase", fn: (s: string) => s.toLowerCase() },
              { label: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
              {
                label: "Capitalize Each Word",
                fn: (s: string) => s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
              },
              {
                label: "tOGGLE cASE",
                fn: (s: string) =>
                  s
                    .split("")
                    .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
                    .join(""),
              },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="menuitem"
                onClick={() => changeCase(opt.fn)}
                className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-secondary/60"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
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
      <ToolbarButton label="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleMark("superscript").run()}>
        <SuperscriptIcon size={14} />
      </ToolbarButton>
      <ToolbarButton label="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleMark("subscript").run()}>
        <SubscriptIcon size={14} />
      </ToolbarButton>
      <Divider />

      <div className="relative">
        <ToolbarButton label="Font color" active={Boolean(textStyle.color)} onClick={() => setColorPopoverOpen((v) => !v)}>
          <span className="relative flex flex-col items-center">
            <Palette size={14} />
            <span className="mt-0.5 h-[3px] w-3.5 rounded-full" style={{ backgroundColor: textStyle.color ?? "var(--muted-fg)" }} />
          </span>
        </ToolbarButton>
        {colorPopoverOpen && (
          <FontColorPopover
            title="Font color"
            swatches={RICH_TEXT_COLOR_SWATCHES}
            current={textStyle.color ?? null}
            noColorLabel="Automatic"
            onPick={(v) => {
              mergeTextStyle({ color: v });
              setColorPopoverOpen(false);
            }}
            onClose={() => setColorPopoverOpen(false)}
          />
        )}
      </div>
      <div className="relative">
        <ToolbarButton label="Highlight color" active={Boolean(textStyle.backgroundColor)} onClick={() => setHighlightPopoverOpen((v) => !v)}>
          <span className="relative flex flex-col items-center">
            <Highlighter size={14} />
            <span className="mt-0.5 h-[3px] w-3.5 rounded-full" style={{ backgroundColor: textStyle.backgroundColor ?? "var(--muted-fg)" }} />
          </span>
        </ToolbarButton>
        {highlightPopoverOpen && (
          <FontColorPopover
            title="Highlight color"
            swatches={RICH_TEXT_HIGHLIGHT_SWATCHES}
            current={textStyle.backgroundColor ?? null}
            noColorLabel="No color"
            onPick={(v) => {
              mergeTextStyle({ backgroundColor: v });
              setHighlightPopoverOpen(false);
            }}
            onClose={() => setHighlightPopoverOpen(false)}
          />
        )}
      </div>
      <ToolbarButton label="Font settings…" onClick={() => setFontDialogOpen(true)}>
        <Settings2 size={14} />
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
      {fontDialogOpen && <FontSettingsDialog editor={editor} onClose={() => setFontDialogOpen(false)} />}
    </div>
  );
}
