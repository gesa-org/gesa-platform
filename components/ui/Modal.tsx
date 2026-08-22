"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // Rendered via a portal straight into document.body rather than in place.
  // Without this, a modal opened from inside any element that has a CSS
  // `transform` on it (e.g. a therapist card's `hover:-translate-y-1`) gets
  // trapped: a transformed ancestor becomes the containing block for
  // `position: fixed` descendants, so instead of covering the full viewport
  // the modal was clipped to that card's own box (and its `overflow-hidden`
  // corners cut it off further) with no dark backdrop behind it — exactly
  // the "static/glitchy modal" bug reported from the Our Therapists page's
  // Book a Session button. Portalling to `document.body` guarantees the
  // modal always positions and sizes against the real viewport, regardless
  // of what component opened it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,30,36,.5)] p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] max-h-[88vh] overflow-auto rounded-[20px] bg-card p-7 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:bg-muted transition-colors float-right"
        >
          <X size={18} />
        </button>
        <div className="clear-both">{children}</div>
      </div>
    </div>,
    document.body
  );
}
