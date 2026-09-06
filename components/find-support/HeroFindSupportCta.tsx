"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/database.types";
import FindSupportModal from "@/components/find-support/FindSupportModal";

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
}: {
  href: string;
  className?: string;
  children: ReactNode;
  clinicLocations: Tables<"clinic_locations">[];
}) {
  const [open, setOpen] = useState(false);

  if (href === MATCH_MODAL_TRIGGER_HREF) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={className}>
          {children}
        </button>
        <FindSupportModal open={open} onClose={() => setOpen(false)} clinicLocations={clinicLocations} />
      </>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
