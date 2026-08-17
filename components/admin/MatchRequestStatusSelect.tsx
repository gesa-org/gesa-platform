"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["new", "contacted", "scheduled", "closed"] as const;

// Same pattern as BookingStatusSelect: write goes through the browser client
// under the admin's own session, enforced by match_requests_admin_update RLS
// (admin role only).
export default function MatchRequestStatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("match_requests").update({ status: next }).eq("id", id);
      if (error) {
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
        className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-primary focus:outline-none disabled:opacity-60"
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
