"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import VolunteerApplicationModal from "@/components/volunteer/VolunteerApplicationModal";

// Phase 63 — self-contained trigger + modal, same pattern as
// components/therapists/BookSessionButton.tsx: every "Become a volunteer
// therapist" / "Join us as a therapist" / "Volunteer" link across the site
// swaps to this instead of a plain <Link href="/contact?subject=Volunteer">,
// so they all open the real application form. `className` is left fully
// open (not a fixed button style) since the four places this is used —
// Footer's nav link, the About page's CTA button, Our Therapists' sidebar
// button, and the signup page's small-print link — each have a completely
// different existing look that needs to stay exactly as it was, only the
// destination changes.
export default function VolunteerApplyButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <VolunteerApplicationModal onClose={() => setOpen(false)} />}
    </>
  );
}
