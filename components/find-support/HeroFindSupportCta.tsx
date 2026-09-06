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

export default function HeroFindSupportCta({
  href,
  className,
  children,
  clinicLocations,
  therapists = [],
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
}) {
  const [open, setOpen] = useState(false);
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

  if (href === MATCH_MODAL_TRIGGER_HREF) {
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
