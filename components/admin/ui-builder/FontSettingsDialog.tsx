"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import FontColorPopover from "@/components/admin/ui-builder/FontColorPopover";
import {
  RICH_TEXT_FONT_FAMILY_OPTIONS,
  RICH_TEXT_FONT_SIZE_OPTIONS,
  RICH_TEXT_COLOR_SWATCHES,
  RICH_TEXT_HIGHLIGHT_SWATCHES,
} from "@/lib/ui-builder/richTextFontOptions";

// Phase 136 — the consolidated "Font" dialog from Roy's reference video
// (Word/WPS: the small launcher arrow at the bottom-right corner of the
// Font ribbon group opens this). Every control here is a real, working
// equivalent of what the video showed, with two deliberate exceptions —
// disclosed here rather than silently dropped:
//
// - No "Hidden" effect. Word's Hidden checkbox makes text invisible but
//   still present in the document — on a public support site that's a
//   real misuse vector (hiding spam/SEO text, or a note an admin thinks is
//   gone but a visitor's browser "Find in page" or screen reader still
//   exposes), not a legitimate content-editing need here.
// - No Outline/Shadow/Reflection/Glow "Text Effects" (WordArt-style
//   decoration). Those are poster/title-slide effects — applied to real
//   paragraph body copy on a nonprofit support site they'd hurt legibility
//   and accessibility far more than they'd help, and they'd fight the
//   site's own carefully tuned typography system (Phase 132's Global
//   Theme). "Set As Default" is also omitted — the equivalent action on
//   this site is the Global Theme tab's own Typography panel, which
//   already sets the site-wide default font/size, not a per-field override.
//
// Font style (Regular/Italic/Bold/Bold Italic) isn't reproduced as its own
// dropdown either — Bold and Italic are already independent toggle buttons
// on the main toolbar, which is the more direct, already-familiar control.
export default function FontSettingsDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  const initialTextStyle = editor.getAttributes("textStyle") as {
    fontFamily?: string | null;
    fontSize?: string | null;
    color?: string | null;
    backgroundColor?: string | null;
    caps?: "small" | "all" | null;
  };

  const [fontFamily, setFontFamily] = useState(initialTextStyle.fontFamily ?? "");
  const [fontSize, setFontSize] = useState(initialTextStyle.fontSize ?? "");
  const [color, setColor] = useState<string | null>(initialTextStyle.color ?? null);
  const [highlight, setHighlight] = useState<string | null>(initialTextStyle.backgroundColor ?? null);
  const [strikethrough, setStrikethrough] = useState(editor.isActive("strike"));
  const [superscript, setSuperscript] = useState(editor.isActive("superscript"));
  const [subscript, setSubscript] = useState(editor.isActive("subscript"));
  const [smallCaps, setSmallCaps] = useState(initialTextStyle.caps === "small");
  const [allCaps, setAllCaps] = useState(initialTextStyle.caps === "all");
  const [colorPopoverOpen, setColorPopoverOpen] = useState<"color" | "highlight" | null>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleApply() {
    const chain = editor.chain().focus();
    chain.setMark("textStyle", {
      fontFamily: fontFamily || null,
      fontSize: fontSize || null,
      color: color || null,
      backgroundColor: highlight || null,
      caps: smallCaps ? "small" : allCaps ? "all" : null,
    });
    if (strikethrough !== editor.isActive("strike")) chain.toggleStrike();
    if (superscript !== editor.isActive("superscript")) chain.toggleMark("superscript");
    if (subscript !== editor.isActive("subscript")) chain.toggleMark("subscript");
    chain.run();
    onClose();
  }

  const previewStyle: React.CSSProperties = {
    fontFamily: fontFamily || undefined,
    fontSize: fontSize || undefined,
    color: color || undefined,
    backgroundColor: highlight || undefined,
    textDecoration: strikethrough ? "line-through" : undefined,
    fontVariant: smallCaps ? "small-caps" : undefined,
    textTransform: allCaps ? "uppercase" : undefined,
    verticalAlign: superscript ? "super" : subscript ? "sub" : undefined,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-20" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gesa-font-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between">
          <h4 id="gesa-font-dialog-title" className="text-[14px] font-semibold">
            Font
          </h4>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-secondary/60">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[12.5px]">
              <span className="text-muted-fg">Font</span>
              <select
                ref={firstFieldRef}
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-[13px]"
              >
                {RICH_TEXT_FONT_FAMILY_OPTIONS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[12.5px]">
              <span className="text-muted-fg">Size</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-[13px]"
              >
                {RICH_TEXT_FONT_SIZE_OPTIONS.map((s) => (
                  <option key={s.label} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative flex flex-col gap-1 text-[12.5px]">
              <span className="text-muted-fg">Font color</span>
              <button
                type="button"
                onClick={() => setColorPopoverOpen(colorPopoverOpen === "color" ? null : "color")}
                className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-[13px]"
              >
                <span
                  className="h-3.5 w-3.5 flex-none rounded-full border border-border"
                  style={{ backgroundColor: color ?? "transparent" }}
                />
                {color ? "Custom" : "Automatic"}
              </button>
              {colorPopoverOpen === "color" && (
                <FontColorPopover
                  title="Font color"
                  swatches={RICH_TEXT_COLOR_SWATCHES}
                  current={color}
                  noColorLabel="Automatic"
                  onPick={(v) => {
                    setColor(v);
                    setColorPopoverOpen(null);
                  }}
                  onClose={() => setColorPopoverOpen(null)}
                />
              )}
            </div>
            <div className="relative flex flex-col gap-1 text-[12.5px]">
              <span className="text-muted-fg">Highlight color</span>
              <button
                type="button"
                onClick={() => setColorPopoverOpen(colorPopoverOpen === "highlight" ? null : "highlight")}
                className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-[13px]"
              >
                <span
                  className="h-3.5 w-3.5 flex-none rounded-full border border-border"
                  style={{ backgroundColor: highlight ?? "transparent" }}
                />
                {highlight ? "Custom" : "No color"}
              </button>
              {colorPopoverOpen === "highlight" && (
                <FontColorPopover
                  title="Highlight color"
                  swatches={RICH_TEXT_HIGHLIGHT_SWATCHES}
                  current={highlight}
                  noColorLabel="No color"
                  onPick={(v) => {
                    setHighlight(v);
                    setColorPopoverOpen(null);
                  }}
                  onClose={() => setColorPopoverOpen(null)}
                />
              )}
            </div>
          </div>

          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-[11.5px] font-semibold text-muted-fg">Effects</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={strikethrough} onChange={(e) => setStrikethrough(e.target.checked)} />
                Strikethrough
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={superscript}
                  onChange={(e) => {
                    setSuperscript(e.target.checked);
                    if (e.target.checked) setSubscript(false);
                  }}
                />
                Superscript
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subscript}
                  onChange={(e) => {
                    setSubscript(e.target.checked);
                    if (e.target.checked) setSuperscript(false);
                  }}
                />
                Subscript
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={smallCaps}
                  onChange={(e) => {
                    setSmallCaps(e.target.checked);
                    if (e.target.checked) setAllCaps(false);
                  }}
                />
                Small caps
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allCaps}
                  onChange={(e) => {
                    setAllCaps(e.target.checked);
                    if (e.target.checked) setSmallCaps(false);
                  }}
                />
                All caps
              </label>
            </div>
          </fieldset>

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Preview</p>
            <div className="flex items-center justify-center rounded-lg border border-border bg-white px-3 py-4">
              <span style={previewStyle}>The path to emotional recovery</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
