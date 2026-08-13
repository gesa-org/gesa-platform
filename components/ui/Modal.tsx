"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,30,36,.5)] p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] max-h-[88vh] overflow-auto rounded-[20px] bg-white p-7 shadow-lg"
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
    </div>
  );
}
