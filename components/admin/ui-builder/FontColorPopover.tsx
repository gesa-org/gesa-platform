"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Phase 136 — the small color-swatch panel behind both the toolbar's Font
// color and Highlight color buttons (see RichTextToolbar.tsx) and the Font
// dialog's two color fields (FontSettingsDialog.tsx). One shared component
// rather than four near-duplicate pickers.
//
// Deliberately swatches-only, no raw hex input: every value that reaches
// lib/ui-builder/sanitizeRichText.ts must be an exact 6-digit hex, and an
// admin typing a hex code by hand is exactly the kind of "arbitrary color"
// choice this phase's own design decision (see richTextFontOptions.ts)
// avoids — a curated, on-brand palette instead of a full color wheel.
export type ColorSwatch = { value: string; label: string };

export default function FontColorPopover({
  title,
  swatches,
  current,
  noColorLabel,
  onPick,
  onClose,
}: {
  title: string;
  swatches: readonly ColorSwatch[];
  current: string | null;
  noColorLabel: string;
  onPick: (value: string | null) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      className="absolute left-0 top-full z-20 mt-1 w-[188px] rounded-xl border border-border bg-card p-2.5 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-muted-fg">{title}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded p-0.5 hover:bg-secondary/60">
          <X size={13} />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {swatches.map((s) => (
          <button
            key={s.value}
            type="button"
            title={s.label}
            aria-label={s.label}
            aria-pressed={current === s.value}
            onClick={() => onPick(s.value)}
            className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
              current === s.value ? "border-primary ring-2 ring-primary/40" : "border-border"
            }`}
            style={{ backgroundColor: s.value }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPick(null)}
        className="mt-2 w-full rounded-md border border-border px-2 py-1 text-[11.5px] text-muted-fg hover:bg-secondary/60"
      >
        {noColorLabel}
      </button>
    </div>
  );
}
