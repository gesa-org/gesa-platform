"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["new", "reviewing", "approved", "rejected"] as const;

// Phase 63 — same pattern as components/admin/BookingStatusSelect.tsx:
// writes go straight through the browser Supabase client under the
// signed-in admin's own session, enforced by the
// therapist_applications_admin_update RLS policy (admin role only), not by
// anything in this component. Marking an application "approved" here is
// just a status label for the admin's own tracking — it does not
// automatically create a therapists row; an admin still adds the actual
// listing themselves once they're satisfied with the application (a
// deliberate human decision, not an automatic promotion).
export default function VolunteerApplicationStatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("therapist_applications")
        .update({ status: next, reviewed_at: new Date().toISOString() })
        .eq("id", id);
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
