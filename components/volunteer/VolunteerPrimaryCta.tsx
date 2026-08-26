"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import VolunteerApplyButton from "@/components/volunteer/VolunteerApplyButton";

// Phase 63 — the About page's "Become a volunteer therapist" button is
// Content Manager-editable (sections.volunteerPrimaryHref/Label, see
// AboutSectionsEditor.tsx), so an admin can already repoint it anywhere.
// Rather than hardcoding it to always open the new application modal (which
// would quietly take that flexibility away), this only opens the modal when
// the href is still the original default value every published row has had
// since Phase 35 — any other href an admin has deliberately set keeps
// working as a normal link, exactly as before.
const VOLUNTEER_DEFAULT_HREF = "/contact?subject=Volunteer";

export default function VolunteerPrimaryCta({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (href === VOLUNTEER_DEFAULT_HREF) {
    return <VolunteerApplyButton className={className}>{children}</VolunteerApplyButton>;
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
