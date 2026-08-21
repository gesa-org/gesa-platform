"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/database.types";

type Faq = Tables<"faqs">;

// Manages the existing `faqs` table directly (already DB-driven since
// before Phase 35 — see lib/queries.ts getFaqs()) rather than duplicating
// FAQ entries into site_content. The banner above the list (eyebrow/title)
// is a separate tab (SimplePageEditor, key "page_faq").
export default function FaqManager({ initialFaqs }: { initialFaqs: Faq[] }) {
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, field: "question" | "answer", val: string) {
    setFaqs((fs) => fs.map((f) => (f.id === id ? { ...f, [field]: val } : f)));
  }

  async function save(faq: Faq) {
    setSavingId(faq.id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("faqs")
      .update({ question: faq.question, answer: faq.answer, sort: faq.sort })
      .eq("id", faq.id);
    setSavingId(null);
    if (error) setError("Couldn't save that entry — try again.");
  }

  async function addFaq() {
    const supabase = createClient();
    const nextSort = faqs.length ? Math.max(...faqs.map((f) => f.sort)) + 1 : 0;
    const { data, error } = await supabase
      .from("faqs")
      .insert({ question: "New question", answer: "New answer", sort: nextSort })
      .select()
      .single();
    if (!error && data) setFaqs((fs) => [...fs, data]);
  }

  async function removeFaq(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (!error) setFaqs((fs) => fs.filter((f) => f.id !== id));
  }

  async function moveSort(id: string, direction: -1 | 1) {
    const sorted = [...faqs].sort((a, b) => a.sort - b.sort);
    const idx = sorted.findIndex((f) => f.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const supabase = createClient();
    await Promise.all([
      supabase.from("faqs").update({ sort: b.sort }).eq("id", a.id),
      supabase.from("faqs").update({ sort: a.sort }).eq("id", b.id),
    ]);
    setFaqs((fs) => fs.map((f) => (f.id === a.id ? { ...f, sort: b.sort } : f.id === b.id ? { ...f, sort: a.sort } : f)));
  }

  const sortedFaqs = [...faqs].sort((a, b) => a.sort - b.sort);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-[13px] text-destructive">{error}</p>}
      {sortedFaqs.map((f, i) => (
        <div key={f.id} className="rounded-xl border border-border p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-muted-fg">
              <GripVertical size={14} /> Question {i + 1}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSort(f.id, -1)}
                disabled={i === 0}
                className="rounded-lg px-2 py-1 text-[12px] text-muted-fg hover:bg-secondary disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSort(f.id, 1)}
                disabled={i === sortedFaqs.length - 1}
                className="rounded-lg px-2 py-1 text-[12px] text-muted-fg hover:bg-secondary disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeFaq(f.id)}
                className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Delete question"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <input
            value={f.question}
            onChange={(e) => update(f.id, "question", e.target.value)}
            className="mb-2 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          <textarea
            rows={3}
            value={f.answer}
            onChange={(e) => update(f.id, "answer", e.target.value)}
            className="mb-2 w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          <Button size="sm" variant="outline" onClick={() => save(f)} disabled={savingId === f.id}>
            {savingId === f.id ? "Saving…" : "Save"}
          </Button>
        </div>
      ))}
      <button
        type="button"
        onClick={addFaq}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-primary hover:bg-secondary"
      >
        <Plus size={14} /> Add question
      </button>
    </div>
  );
}
