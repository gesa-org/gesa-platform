"use client";

import { useState, useTransition } from "react";

const STATUSES = ["New", "Seen", "In Progress", "Resolved", "Archived"] as const;

// Phase 150 — same pattern as SupportRequestStatusSelect: inquiries now has
// a real status column (added this phase — see the extend_inquiries_status_
// notes_source_consent migration), written through
// /api/admin/inquiries/update rather than a direct browser Supabase write,
// so it's re-checked server-side regardless of this table's RLS state.
export default function InquiryStatusSelect({
  id,
  status,
  onChanged,
}: {
  id: string;
  status: string;
  onChanged?: (next: string) => void;
}) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/inquiries/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: next }),
        });
        if (!res.ok) throw new Error("failed");
        onChanged?.(next);
      } catch {
        setError("Couldn't save — try again.");
        setValue(status);
      }
    });
  }

  return (
    <div>
      <select
        value={value}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-primary focus:outline-none disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <div className="mt-1 text-[11.5px] text-destructive">{error}</div>}
    </div>
  );
}
