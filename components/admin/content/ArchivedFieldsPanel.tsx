"use client";

import type { ReactNode } from "react";

// Phase 247 — Content Manager rebuild Phase 1. Several editors have long
// carried fields that genuinely aren't rendered on the live site anymore
// (About's founder-section intro, four of Footer's legacy column labels) —
// kept only because of this codebase's standing "don't delete data just
// because a section stopped rendering it" rule. Until now they sat inline
// with real, live-editable fields, distinguished only by a label suffix
// like "(not currently shown on the page)" — easy to miss, and exactly the
// "distracts from editable live content" problem Roy's rebuild asked to
// fix. This is a small, shared, collapsed-by-default wrapper (closed on
// load, so it takes zero visual space until an admin deliberately opens it)
// rather than a bespoke <details> block per editor, so every "not shown
// live" group across Content Manager looks and behaves identically.
export default function ArchivedFieldsPanel({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-dashed border-border/70 bg-secondary/40 px-4 py-3">
      <summary className="cursor-pointer select-none text-[13px] font-semibold text-muted-fg marker:content-none">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block transition-transform group-open:rotate-90">›</span>
          Archived / not shown live (hidden by default)
        </span>
      </summary>
      <p className="mb-3 mt-2 text-[12px] text-muted-fg">
        These fields aren&apos;t rendered anywhere on the public site right now. Kept so no content is lost — safe to
        ignore unless you&apos;re specifically restoring one of them.
      </p>
      <div className="flex flex-col gap-4">{children}</div>
    </details>
  );
}
