"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BookingStatus } from "@/lib/database.types";

const STATUSES: BookingStatus[] = ["confirmed", "cancelled"];

// Cancelling here is what actually frees the slot back up for other
// clients — get_booked_slots() (used by /api/therapist-availability) only
// counts rows with status = 'confirmed', so flipping this to "cancelled"
// takes effect immediately without any other change needed.
export default function SessionBookingStatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: BookingStatus) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("session_bookings").update({ status: next }).eq("id", id);
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
        onChange={(e) => onChange(e.target.value as BookingStatus)}
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
