"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
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
      aria-label="Find support"
    >
      <div
        className="relative w-full max-w-[720px] rounded-2xl bg-card p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* This is the modal's own close affordance (dismiss, no side
            effects) — distinct from ChoiceScreen's own "X", which
            deliberately means "skip the AI/Manual question and go straight
            to Our Professionals" (see that component's comment). Having
            both is intentional: one closes the dialog, the other is a
            content-level shortcut. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-fg hover:bg-secondary"
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
