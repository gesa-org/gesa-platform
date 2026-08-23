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
export default function FaqAccordion({ faqs }: { faqs: Tables<"faqs">[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-9 mt-[36px] flex flex-col gap-3">
      {faqs.map((f, i) => {
        const open = openIndex === i;
        return (
          <div key={f.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
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
      })}
    </div>
  );
}
