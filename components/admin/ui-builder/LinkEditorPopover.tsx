"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { validateLinkUrl } from "@/lib/ui-builder/sanitizeRichText";

// Phase 134 — the rich-text toolbar's link tool. A real dialog (role,
// focus trap, Escape-to-close) rather than a plain floating div, per the
// accessibility requirements. Kept as its own small component (not folded
// into RichTextToolbar.tsx) since it has its own focus-trap/keyboard
// lifecycle independent of the toolbar buttons around it.
export type LinkPopoverValue = {
  text: string;
  url: string;
  openInNewTab: boolean;
};

export default function LinkEditorPopover({
  initial,
  hasExistingLink,
  onSave,
  onRemove,
  onClose,
}: {
  initial: LinkPopoverValue;
  hasExistingLink: boolean;
  onSave: (value: LinkPopoverValue) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial.text);
  const [url, setUrl] = useState(initial.url);
  const [openInNewTab, setOpenInNewTab] = useState(initial.openInNewTab);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Minimal focus trap — Tab wraps within the dialog's own focusable
      // controls rather than escaping to the page behind it.
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

  function handleSave() {
    const result = validateLinkUrl(url);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    if (!text.trim()) {
      setError("Enter the link text.");
      return;
    }
    onSave({ text: text.trim(), url: result.url, openInNewTab });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-24" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gesa-link-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between">
          <h4 id="gesa-link-dialog-title" className="text-[14px] font-semibold">
            {hasExistingLink ? "Edit link" : "Insert link"}
          </h4>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-secondary/60">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[12.5px]">
            <span className="text-muted-fg">Link text</span>
            <input
              ref={firstFieldRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-lg border border-border px-2.5 py-1.5 text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12.5px]">
            <span className="text-muted-fg">Destination URL</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded-lg border border-border px-2.5 py-1.5 text-[13px]"
            />
          </label>
          <label className="flex items-center gap-2 text-[12.5px]">
            <input type="checkbox" checked={openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} />
            Open in new tab
          </label>
          {error && (
            <p role="alert" className="text-[12px] text-destructive">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 pt-1">
            {hasExistingLink ? (
              <Button type="button" variant="outline" size="sm" onClick={onRemove}>
                Remove link
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
