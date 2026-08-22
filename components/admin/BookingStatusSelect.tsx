"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["new", "contacted", "scheduled", "closed"] as const;

// Writes go straight through the browser Supabase client under the signed-in
// admin's own session — enforced by the booking_requests_admin_update RLS
// policy (admin role only), not by anything in this component. This page is
// only reachable via /admin (gated by requireAdmin()), but even a direct API
// call from a non-admin session would be rejected by RLS.
export default function BookingStatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("booking_requests").update({ status: next }).eq("id", id);
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
