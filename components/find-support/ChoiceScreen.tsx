"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkle, Users, X, Loader2 } from "lucide-react";

// Phase 142 — the "Find Support" entry point. Replaces the old direct-to-
// therapist-list CTA flow: every "Find Support" link site-wide now lands
// here first (see lib/navigation.ts), and the client explicitly chooses a
// pathway instead of being dropped straight into either flow. Both choices
// are logged to support_requests via /api/support-pathway purely for CRM
// visibility — see that route's comment.
//
// "Closeable" per the spec: there's nothing to close back to on this page
// (it's the page's own first section, not a modal), so "close" here means
// dismissing the choice and going straight to Our Professionals — the same
// destination Manual Support goes to — which is the least-friction way to
// let someone skip the question entirely.
export default function ChoiceScreen({
  onChooseAi,
  onChooseBrowse,
}: {
  onChooseAi: () => void;
  // Phase 151 — fired when the "Browse therapist" card itself is clicked
  // (not the header's "X"), opening the new guided Browse Therapist search
  // modal instead of redirecting straight to /therapists. See
  // HeroFindSupportCta.tsx, which owns the modal-swap this triggers.
  onChooseBrowse: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"ai" | "manual" | "browse" | null>(null);

  async function logPathway(pathway: "ai" | "manual") {
    try {
      await fetch("/api/support-pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathway }),
      });
    } catch {
      // Non-fatal — never block navigation on this.
    }
  }

  async function chooseManual() {
    setPending("manual");
    await logPathway("manual");
    router.push("/therapists?source=manual-support");
  }

  async function chooseAi() {
    setPending("ai");
    await logPathway("ai");
    onChooseAi();
  }

  // Phase 151 — the "Browse therapist" card no longer redirects straight to
  // /therapists; it opens the new guided search instead (see
  // BrowseTherapistModal). Still logged as the "manual" pathway for CRM
  // purposes — it's the same fundamental "I'll pick my own therapist rather
  // than being AI-matched" choice `chooseManual` always represented, just
  // with a guided search step in front of it now instead of landing
  // directly on the full, unfiltered directory. The header's "X" (still
  // `chooseManual`, unchanged) keeps its own separate, simpler "skip
  // straight to the full directory" behavior.
  async function chooseBrowse() {
    setPending("browse");
    await logPathway("manual");
    setPending(null);
    onChooseBrowse();
  }

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px]">How would you like to find support?</h2>
        <button
          type="button"
          onClick={chooseManual}
          aria-label="Skip and browse our professionals directly"
          className="rounded-full p-1.5 text-muted-fg hover:bg-secondary"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={chooseAi}
          disabled={pending !== null}
          className="flex flex-col items-start gap-3 rounded-[var(--radius)] border border-border bg-card p-6 text-left shadow-soft transition-colors hover:border-primary-600 disabled:opacity-60"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-primary">
            {pending === "ai" ? <Loader2 size={20} className="animate-spin" /> : <Sparkle size={20} />}
          </span>
          <span className="text-[17px] font-semibold">AI Support</span>
          <span className="text-[13.5px] text-muted-fg">
            Tell us what you need and we&apos;ll suggest suitable professionals.
          </span>
        </button>

        <button
          type="button"
          onClick={chooseBrowse}
          disabled={pending !== null}
          className="flex flex-col items-start gap-3 rounded-[var(--radius)] border border-border bg-card p-6 text-left shadow-soft transition-colors hover:border-primary-600 disabled:opacity-60"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand-brown/30 text-primary">
            {pending === "browse" ? <Loader2 size={20} className="animate-spin" /> : <Users size={20} />}
          </span>
          {/* Phase 148 — Roy asked to rename this option from "Manual
              Support" to "Browse therapist" (its supporting description
              below is unchanged).
              Phase 151 — this card now opens the guided Browse Therapist
              search modal (`chooseBrowse`) instead of redirecting straight
              to /therapists (`chooseManual`, still used by the header's "X"
              only — see this component's own comment above). */}
          <span className="text-[17px] font-semibold">Browse therapist</span>
          <span className="text-[13.5px] text-muted-fg">
            Browse our professionals and choose the person you feel is right for you.
          </span>
        </button>
      </div>
    </div>
  );
}
