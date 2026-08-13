"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Tables } from "@/lib/database.types";

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
