"use client";

import { useState, useTransition } from "react";

const STATUSES = [
  "started",
  "preferences_submitted",
  "matched",
  "no_match",
  "therapist_selected",
  "booking_requested",
  "scheduled",
  "completed",
  "cancelled",
  "redirected_manual",
] as const;

// Phase 142 — unlike MatchRequestStatusSelect, this can't write straight
// through the browser Supabase client: support_requests has no RLS policy
// at all (see the create_support_requests migration), so every write goes
// through /api/admin/support-requests/status, which re-checks admin status
// server-side before using the service-role client.
export default function SupportRequestStatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/support-requests/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: next }),
        });
        if (!res.ok) throw new Error("failed");
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
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {error && <div className="mt-1 text-[11.5px] text-destructive">{error}</div>}
    </div>
  );
}
