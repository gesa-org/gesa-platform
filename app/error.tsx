"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Button from "@/components/ui/Button";

// Phase 204 — Next.js App Router segment-level error boundary. Wraps every
// page below the root layout, so Header/Footer/CrisisButton still render
// here (only the page's own content threw, not the layout itself — see
// app/global-error.tsx for the "the root layout itself crashed" case, which
// has to replace the whole document instead of just this slot).
//
// Deliberately hardcoded, not Content Manager-editable like
// app/not-found.tsx's copy: Next.js requires this file to be a Client
// Component receiving only {error, reset} — no server-fetched props — so
// the only way to make its copy admin-editable would be a client-side
// fetch on mount, which adds a second thing that can fail to the one page
// whose entire job is being the safety net for something that already
// failed. Kept intentionally simple and static instead; same reasoning
// covers app/global-error.tsx.
export default function SegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Logged with enough detail to diagnose from Vercel's function/runtime
    // logs, same pattern as app/admin/therapists/[id]/error.tsx.
    console.error("Unhandled error on a public page:", error.message, error.stack, error.digest);
  }, [error]);

  return (
    <PageHero
      icon={AlertTriangle}
      eyebrow="Something went wrong"
      title="This page hit a snag."
      description="Nothing on your end caused this. Please try again, or head back to the homepage — if it keeps happening, let us know."
      narrow
    >
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="outline">
          Back to Home
        </Button>
      </div>
    </PageHero>
  );
}
