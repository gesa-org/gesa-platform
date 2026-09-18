"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/components/motion/config";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Phase 220 — Roy sent a reference screenshot of the volunteer/caregiver
// application modal and asked for a shared Sand Grey background applied to it
// and every other form modal site-wide. This shared panel is what every
// modal that doesn't set its own background class renders through, so this
// one line recolors most of them at once; a handful of modals set their own
// className instead (see those files' own Phase 220 comments) and were
// updated to match. See app/globals.css's --sand-grey comment.
//
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
  const panelRef = useRef<HTMLDivElement>(null);
  // Phase 233 — Roy asked for real keyboard/screen-reader modal behavior on
  // the new donation modal specifically (focus moves in on open, returns to
  // the trigger on close, Tab stays trapped inside while open) — added here,
  // to the one shared Modal every modal site-wide renders through, rather
  // than as bespoke logic in that one caller, so every existing modal
  // (booking, intake, volunteer application, etc.) picks up the same fix at
  // once instead of drifting further apart. Purely additive: no change to
  // when a modal opens/closes, what it contains, or its visual appearance.
  const triggerRef = useRef<HTMLElement | null>(null);

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

  // Focus management: remember whatever had focus right before this modal
  // opened (almost always the button/link that triggered it), move focus
  // into the panel once it's mounted, and hand focus back to that same
  // element when the modal closes — so a keyboard/screen-reader user lands
  // inside the dialog on open and isn't left stranded (focus on a now-gone
  // element, or silently reset to <body>) on close.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusTarget = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel;
    // Next tick — the panel's own children (and framer-motion's mount) need
    // to exist in the DOM first.
    const id = window.setTimeout(() => focusTarget?.focus(), 0);
    return () => {
      window.clearTimeout(id);
      triggerRef.current?.focus?.();
    };
  }, [open]);

  // Basic focus trap: while open, Tab/Shift+Tab cycles only through
  // focusable elements inside the panel rather than escaping to whatever
  // sits behind the backdrop.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,30,36,.5)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.micro, ease: MOTION_EASE }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="max-h-[88vh] max-h-[calc(100dvh-2.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-[520px] overflow-auto rounded-[20px] bg-sand-grey p-5 shadow-lg outline-none sm:p-7"
            onClick={(e) => e.stopPropagation()}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: MOTION_DURATION.reveal, ease: MOTION_EASE }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-secondary hover:bg-muted transition-colors float-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
