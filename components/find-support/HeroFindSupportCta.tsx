"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Tables, PublicTherapistRow } from "@/lib/database.types";
import FindSupportModal from "@/components/find-support/FindSupportModal";
import BrowseTherapistModal from "@/components/find-support/BrowseTherapistModal";

// Phase 146 — Roy asked to bring the full AI Matching flow back behind the
// Find Support page's own hero CTA (the button that scrolls to "How GESA
// Works" since Phase 145) instead of living on its own page. Same
// recognized-default-href pattern as VolunteerPrimaryCta (components/
// volunteer/VolunteerPrimaryCta.tsx): only the exact default href this
// field has held since Phase 145 (`#how-it-works`) opens the modal — any
// other href an admin deliberately sets in Content Manager for this CTA
// keeps working as a plain link/anchor, so this doesn't quietly take that
// field's flexibility away.
const MATCH_MODAL_TRIGGER_HREF = "#how-it-works";

// Phase 222 — Roy reported the AI Matching modal wouldn't open at all. Root
// cause: the live "page_about_hero" Content Manager row's Primary CTA link
// had drifted to "/find-your-therapist" (almost certainly a side effect of
// this session's About/Find-Support/Community routing changes) — an exact
// repeat of the "/Find-your-therapist" incident already documented above
// this constant. The live data has been corrected back to the literal
// sentinel, but a free-text admin field with no validation will drift again
// eventually, so this comparison is now whitespace/case-tolerant as a second
// line of defense — it will still recognize the sentinel even if an admin
// pastes " #How-It-Works " or similar, while any href that isn't recognizably
// this value still falls through to the plain-link branch unchanged.
function isMatchModalTrigger(value: string): boolean {
  return value.trim().toLowerCase() === MATCH_MODAL_TRIGGER_HREF;
}

export default function HeroFindSupportCta({
  href,
  className,
  children,
  clinicLocations,
  therapists = [],
  autoOpen = false,
  contextLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  clinicLocations: Tables<"clinic_locations">[];
  // Phase 151 — only needed so this component can hand it down to
  // BrowseTherapistModal (Browse Therapist search needs the full active
  // roster to filter against). Defaults to [] rather than required, same
  // reasoning as `clinicLocations` above.
  therapists?: PublicTherapistRow[];
  // Phase 242 — when true (and `href` is the recognized modal-trigger
  // sentinel below), opens the AI Matching modal on mount instead of
  // waiting for a click. Added so a link elsewhere on the site (Home's
  // TERROR portal card, via `/about?openMatch=terror`) can drop a visitor
  // straight into AI Matching rather than requiring them to click "Match
  // Support" again once they arrive. Defaults to false, so every existing
  // render of this component (a plain click-to-open button) is unaffected.
  autoOpen?: boolean;
  // Phase 242 — optional short line rendered inside the modal, above the
  // choice screen/wizard, so a visitor who arrived via a pathway-specific
  // link (see `autoOpen` above) can see that context carried through.
  // Purely a passthrough to FindSupportModal — this component has no
  // opinion on its content.
  contextLabel?: string;
}) {
  // Phase 243 (bug fix) — this used to always start `false` and rely on a
  // post-mount `useEffect` to flip it to `true` for the `autoOpen` case.
  // That guaranteed at least one real paint of the plain About Hero (its own
  // static eyebrow/heading/subtitle/CTA text column on the left, plus the
  // right-hand painting) — both the server-rendered HTML and the first
  // client hydration pass had `open=false`, so the effect firing a moment
  // later was a visible second render: the Hero's left column flashed on
  // screen, then was replaced by the AI Support/Browse-therapist modal. That
  // flash is the "static field on the left side" bug reported against the
  // Home TERROR card's `/about?openMatch=terror` flow.
  //
  // Fixed by computing the initial value directly from `autoOpen`/`href` in
  // the `useState` initializer instead of an effect. `autoOpen` and `href`
  // are both resolved server-side (from the URL's `openMatch` query param,
  // not from `window`/browser APIs), so this initializer produces the exact
  // same result during SSR and during client hydration — no
  // server/client mismatch — which means the very first HTML the browser
  // paints already has the modal open. There is no longer an intermediate
  // "closed" frame to flash for the auto-open case, and manual click-to-open
  // (`autoOpen` false/omitted, the other two portal cards' shared About-page
  // entry points, etc.) is unaffected since it still starts `false` exactly
  // as before.
  const [open, setOpen] = useState(() => autoOpen && isMatchModalTrigger(href));
  // Phase 151 — sibling to `open` above rather than owned by FindSupportModal
  // itself: ChoiceScreen's "Browse therapist" card needs to close the AI/
  // Manual choice modal AND open this new one, and the two modals need to
  // never both be mounted-and-visible at once (see BrowseTherapistModal's
  // own z-index comment for why that specifically matters for booking
  // sub-modals). Lifting both booleans to this shared parent is what makes
  // "close one, open the other" a single, atomic state update.
  const [browseOpen, setBrowseOpen] = useState(false);

  function openBrowseSearch() {
    setOpen(false);
    setBrowseOpen(true);
  }

  if (isMatchModalTrigger(href)) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={className}>
          {children}
        </button>
        <FindSupportModal
          open={open}
          onClose={() => setOpen(false)}
          clinicLocations={clinicLocations}
          onChooseBrowse={openBrowseSearch}
          contextLabel={contextLabel}
        />
        <BrowseTherapistModal open={browseOpen} onClose={() => setBrowseOpen(false)} therapists={therapists} />
      </>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
