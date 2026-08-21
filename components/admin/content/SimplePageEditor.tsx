"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { SimplePageContent } from "@/lib/content";

// Reusable editor for every page whose Content Manager surface is just its
// PageHero banner (eyebrow / title / description) plus a published toggle —
// Our Therapists, Support Groups, Blog, Contact, and FAQ (which has no
// description field, hence hasDescription). One component covers five of
// Roy's requested "Pages" tabs instead of five near-identical forms.
export default function SimplePageEditor({
  contentKey,
  initial,
  hasDescription,
  note,
}: {
  contentKey: string;
  initial: SimplePageContent;
  hasDescription: boolean;
  note?: string;
}) {
  const [eyebrow, setEyebrow] = useState(initial.eyebrow);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [published, setPublished] = useState(initial.published);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const supabase = createClient();
    const value: SimplePageContent = { published, eyebrow, title, description };
    const { error } = await supabase.from("site_content").upsert({ key: contentKey, value }, { onConflict: "key" });
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-4">
      {note && <p className="text-[13px] text-muted-fg">{note}</p>}

      <label className="flex items-center gap-2.5 text-[14px] font-medium">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
        Published (unchecking reverts this banner to the built-in default instantly)
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Eyebrow label</label>
        <input
          value={eyebrow}
          onChange={(e) => setEyebrow(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>

      {hasDescription && (
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-border pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Saved.</span>}
        {status === "error" && <span className="text-[13.5px] font-medium text-destructive">Couldn&apos;t save — try again.</span>}
      </div>
    </form>
  );
}
