"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Tables } from "@/lib/database.types";

// Phase 45 — investigated adding the spec's section-9 accordion open/close
// animation here (motion height/opacity transition on the answer), but
// tried and reverted it: tests/unit/FaqAccordion.test.tsx asserts both
// the default-open answer AND a just-clicked-open answer are
// synchronously `toBeVisible()` with no `waitFor` anywhere in the file —
// any real transition duration (even the spec's own 150-250ms "micro"
// range) makes the just-opened answer read as not-yet-visible at the
// exact instant those assertions run, which actually failed this test
// when tried. The spec's own top-priority rule ("preserve all existing
// GESA functionality") outranks adding motion polish to this one
// component, so this file is intentionally unchanged from before Phase 45
// — the chevron's rotate-transform transition was already smooth and
// still is.
// Phase 203 — groups by `category` (new this phase) only when more than one
// distinct value actually exists across `faqs`. Every FAQ that predates
// this column defaults to "General" at the DB level (migration
// phase_203_faq_categories), so a site with exactly one category in use —
// true for every existing render until an admin assigns a second one via
// FaqManager.tsx — renders identically to before this phase: a flat list,
// no group heading, same DOM shape the test below already asserts against.
// `openId` (an id, not the old flat-array index) tracks the single open
// question across the whole list/all groups — same "only one open at a
// time, first item open by default" behavior as before, just no longer
// tied to a flat array position now that items can sit under group
// headings.
export default function FaqAccordion({ faqs }: { faqs: Tables<"faqs">[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  const categories = Array.from(new Set(faqs.map((f) => f.category || "General")));
  const grouped = categories.length > 1;

  function renderItem(f: Tables<"faqs">) {
    const open = openId === f.id;
    return (
      <div key={f.id} className="overflow-hidden rounded-2xl border border-border bg-card">
        <button
          onClick={() => setOpenId(open ? null : f.id)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-semibold"
        >
          {f.question}
          <ChevronDown
            size={18}
            className={`flex-none text-muted-fg transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && <p className="px-5 pb-4 text-[14.5px] text-muted-fg">{f.answer}</p>}
      </div>
    );
  }

  if (!grouped) {
    return <div className="mt-9 mt-[36px] flex flex-col gap-3">{faqs.map(renderItem)}</div>;
  }

  return (
    <div className="mt-9 mt-[36px] flex flex-col gap-7">
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-fg">{category}</h3>
          {faqs.filter((f) => (f.category || "General") === category).map(renderItem)}
        </div>
      ))}
    </div>
  );
}
