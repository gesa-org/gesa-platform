"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import FindSupportFlow from "@/components/find-support/FindSupportFlow";
import type { Tables } from "@/lib/database.types";

// Phase 146 — Roy asked to bring back the full AI Matching architecture
// (the choice screen + 4-step MatchWizard, built in Phase 142/143, taken off
// its own page in Phase 145) as a modal that opens from the Find Support
// page's own hero CTA, rather than reviving a separate /find-your-therapist-
// style page for it. `FindSupportFlow` itself (the choice-screen/wizard
// toggle) is unchanged from Phase 142 — this component is purely the modal
// chrome around it: backdrop, Escape-to-close, click-outside-to-close, and
// a body-scroll lock while open, the same pattern already used elsewhere on
// this site for modals (e.g. VolunteerApplyButton's application modal).
export default function FindSupportModal({
  open,
  onClose,
  clinicLocations,
  onChooseBrowse,
}: {
  open: boolean;
  onClose: () => void;
  clinicLocations: Tables<"clinic_locations">[];
  // Phase 151 — passed straight through to FindSupportFlow/ChoiceScreen.
  // HeroFindSupportCta owns what actually happens when this fires (closing
  // this modal and opening BrowseTherapistModal in its place) — see that
  // file's own comment.
  onChooseBrowse: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Phase 199 (mobile/a11y pass) — this modal previously only had Escape-
  // to-close, click-outside-to-close, and a body-scroll lock: no focus trap
  // and no return-focus-on-close, even though a real modal needs both (a
  // Tab press could previously move focus to page content sitting behind
  // the overlay, and closing never gave focus back to whatever opened it —
  // the hero CTA button). Added here using the same pattern already used by
  // components/MobileNavDrawer.tsx, so the two dialog components in this
  // codebase behave identically for keyboard/screen-reader users.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function focusableEls() {
      return panelRef.current
        ? Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = focusableEls();
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

    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      // Phase 148 — Roy flagged the panel sitting too close to the top of
      // the popup, with the "How would you like to find support?" choice
      // screen appearing right at the edge with barely any breathing room
      // above it. Switched from `items-start` (pins the dialog to the top
      // of the viewport, only `py-10 sm:py-16` above it) to `items-center`
      // (vertically centers it whenever it's short enough to fit), and
      // increased the vertical padding so there's real space above it even
      // on a short viewport or once it scrolls to the top. `overflow-y-auto`
      // on this outer layer still lets a tall step (e.g. Matches with
      // several cards) scroll the whole dialog into view rather than
      // clipping it.
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-16 sm:py-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AI Matching Support"
    >
      {/* Phase 220 — warm ivory modal background, matching every other form
          modal site-wide (see components/ui/Modal.tsx's own Phase 220
          comment and app/globals.css's --modal-ivory). This modal renders
          its own panel div instead of going through the shared Modal.tsx,
          so it needed the same class swap applied directly here. */}
      <div
        ref={panelRef}
        className="relative w-full max-w-[720px] rounded-2xl bg-modal-ivory p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Phase 199 (mobile/a11y pass) — this is now the modal's only
            close control. ChoiceScreen used to render its own second "X"
            a few pixels below this one (see ChoiceScreen.tsx's Phase 199
            note) — removed there, not just visually hidden, so exactly one
            close-looking element exists in the DOM. Explicit focus-visible
            ring added (the site's `<button>`s generally rely on the
            browser default outline, which several browsers suppress on
            rounded/icon-only buttons) so keyboard users get a clear,
            visible focus state here specifically. */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close AI Matching Support"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-fg transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <X size={18} />
        </button>
        <div className="max-h-[80vh] overflow-y-auto pt-2">
          <FindSupportFlow clinicLocations={clinicLocations} onChooseBrowse={onChooseBrowse} />
        </div>
      </div>
    </div>
  );
}
