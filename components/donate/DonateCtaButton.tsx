"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { DonatePageContent } from "@/lib/content";
import DonateModal from "@/components/donate/DonateModal";

// Phase 233 — self-contained trigger + modal, same pattern as
// components/volunteer/VolunteerApplyButton.tsx: a drop-in replacement for
// any donation CTA that used to be a plain link/anchor-scroll (hero "Donate
// Now", the final "Make a Donation" band — previously a stale
// `href="/contact?subject=Volunteer"` left over from before this band was
// repurposed to a donation ask). `className`/`children` are left fully
// open so each existing call site keeps its exact current button styling,
// label, and placement — only the click behavior changes, from a link/
// anchor to opening DonateModal.
//
// `content` is required (not defaulted to DONATE_PAGE_FALLBACK here) to
// avoid a circular import — DonatePage.tsx, which exports that fallback,
// is also this component's only current caller. Every call site already
// has the Donate page's resolved content in scope and passes it explicitly,
// so admin edits (amounts, labels, giftNote, etc.) show up exactly as they
// do in the giving section. A future non-Donate-page call site (e.g. the
// header) should import DONATE_PAGE_FALLBACK itself and pass it through.
export default function DonateCtaButton({
  content,
  className,
  children,
}: {
  content: DonatePageContent;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <DonateModal content={content} onClose={() => setOpen(false)} />}
    </>
  );
}
