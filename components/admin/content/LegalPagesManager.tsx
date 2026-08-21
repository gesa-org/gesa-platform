"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/database.types";

type LegalPage = Tables<"legal_pages">;

// CRUD over the existing `legal_pages` table (already DB-driven via the
// dynamic app/[slug]/page.tsx route — see lib/queries.ts getLegalPage()).
// Covers all 5 of Roy's requested legal pages: Privacy Policy, Cookies
// Policy, Legal Notice, Accessibility Statement, Terms & Conditions.
export default function LegalPagesManager({ pages }: { pages: LegalPage[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(pages[0]?.id ?? null);
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>(
    Object.fromEntries(pages.map((p) => [p.id, { title: p.title, body: p.body }]))
  );
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const selected = pages.find((p) => p.id === selectedId) ?? null;
  const draft = selectedId ? drafts[selectedId] : null;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !draft) return;
    setPending(true);
    setStatus("idle");
    const supabase = createClient();
    const { error } = await supabase
      .from("legal_pages")
      .update({ title: draft.title, body: draft.body })
      .eq("id", selected.id);
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
      <div className="flex flex-col gap-1.5">
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setSelectedId(p.id);
              setStatus("idle");
            }}
            className={`rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors ${
              p.id === selectedId ? "bg-secondary text-primary" : "text-muted-fg hover:bg-secondary/60"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {selected && draft && (
        <form onSubmit={onSave} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDrafts((d) => ({ ...d, [selected.id]: { ...d[selected.id], title: e.target.value } }))}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Body</label>
            <textarea
              rows={16}
              value={draft.body}
              onChange={(e) => setDrafts((d) => ({ ...d, [selected.id]: { ...d[selected.id], body: e.target.value } }))}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 font-mono text-[13px] focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-[12px] text-muted-fg">Plain text. Line breaks are preserved on the live page.</p>
          </div>
          <div className="flex items-center gap-4 border-t border-border pt-4">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Saved.</span>}
            {status === "error" && (
              <span className="text-[13.5px] font-medium text-destructive">Couldn&apos;t save — try again.</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
