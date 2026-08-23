"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/components/motion/config";

// Phase 46 — this is the single most-reused interactive surface on the
// site (booking, intake, and support-group registration all go through
// this one component), and it previously had zero transition at all: a
// modal either existed at full opacity or didn't exist, snapping in and
// out with no acknowledgment of the state change. AnimatePresence now
// animates the backdrop fade and a small scale+fade on the panel itself
// (spec section 17's "controlled transitions" and section 11's micro-
// interaction timing). No change to when the modal opens/closes, what it
// contains, the portal target, the escape-key handler, or the
// backdrop-click-to-close behavior — purely the transition in and out.
export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,30,36,.5)] p-5"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.micro, ease: MOTION_EASE }}
        >
          <motion.div
            className="w-full max-w-[520px] max-h-[88vh] overflow-auto rounded-[20px] bg-card p-7 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: MOTION_DURATION.reveal, ease: MOTION_EASE }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:bg-muted transition-colors float-right"
            >
              <X size={18} />
            </button>
            <div className="clear-both">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
