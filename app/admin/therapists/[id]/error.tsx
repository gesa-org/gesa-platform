"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

// Phase 188 — Next.js App Router error boundary for this route segment.
// Next.js automatically wraps app/admin/therapists/[id]/page.tsx in this
// component, so any render-time exception thrown by the page or by
// TherapistEditForm (e.g. a future missing/undefined field the form
// doesn't defensively guard) shows this fallback instead of the generic
// "Application error: a client-side exception has occurred" screen with
// no way back to the list. This is a safety net on top of the actual
// root-cause fix (see lib/queries.ts's THERAPIST_ADMIN_LIST_COLUMNS
// comment) — it does not replace fixing the underlying data/type bug that
// throws in the first place.
export default function TherapistEditError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Logged with enough detail to actually diagnose the next one from
    // Vercel's function/runtime logs — the message alone ("client-side
    // exception") is what made this bug hard to pin down without reading
    // the source.
    console.error("Therapist edit page crashed:", error.message, error.stack, error.digest);
  }, [error]);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6">
      <Link href="/admin/therapists" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        <ArrowLeft size={14} /> All professionals
      </Link>
      <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle size={18} />
          <h2 className="text-[15px] font-semibold">This professional&apos;s edit page couldn&apos;t load</h2>
        </div>
        <p className="text-[13.5px] text-muted-fg">
          Something went wrong loading this record. This has been logged to the console for diagnosis — it&apos;s
          likely a data issue on this specific profile rather than the CRM itself.
        </p>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={reset}>
            Try again
          </Button>
          <Link href="/admin/therapists" className="text-[13px] font-semibold text-primary underline">
            Back to Our Professionals
          </Link>
        </div>
      </div>
    </div>
  );
}
