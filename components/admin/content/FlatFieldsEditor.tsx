"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

type Field = { key: string; label: string; multiline?: boolean; help?: string };

// Generic editor for any site_content shape that's just a flat map of
// string fields plus `published` — covers Header, Footer, and the Our
// Therapists / Support Groups directory microcopy. Avoids writing four
// near-identical bespoke forms for shapes that don't need arrays or nested
// objects (see AboutSectionsEditor for the one shape that does).
export default function FlatFieldsEditor<T extends { published: boolean }>({
  contentKey,
  initial,
  fields,
  note,
  groups,
}: {
  contentKey: string;
  initial: T;
  fields?: Field[];
  note?: string;
  groups?: { heading: string; fields: Field[] }[];
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const [k, val] of Object.entries(initial)) {
      if (k !== "published") v[k] = String(val ?? "");
    }
    return v;
  });
  const [published, setPublished] = useState(initial.published);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const allFields = groups ? groups.flatMap((g) => g.fields) : fields ?? [];

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const supabase = createClient();
    const value = { ...values, published };
    const { error } = await supabase.from("site_content").upsert({ key: contentKey, value }, { onConflict: "key" });
    setPending(false);
    setStatus(error ? "error" : "saved");
  }

  function renderField(f: Field) {
    return (
      <div key={f.key}>
        <label className="mb-1.5 block text-sm font-semibold">{f.label}</label>
        {f.multiline ? (
          <textarea
            rows={2}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        ) : (
          <input
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
        )}
        {f.help && <p className="mt-1 text-[12px] text-muted-fg">{f.help}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-5">
      {note && <p className="text-[13px] text-muted-fg">{note}</p>}

      <label className="flex items-center gap-2.5 text-[14px] font-medium">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
        Published
      </label>

      {groups
        ? groups.map((g) => (
            <div key={g.heading} className="flex flex-col gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
              <h3 className="text-[15px] font-semibold">{g.heading}</h3>
              {g.fields.map(renderField)}
            </div>
          ))
        : allFields.map(renderField)}

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
