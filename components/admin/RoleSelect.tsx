"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/database.types";

const ROLES: AppRole[] = ["admin", "reviewer", "therapist", "client", "finance"];

// Same pattern as BookingStatusSelect: the write goes through the browser
// client under the admin's own session, enforced by the
// profiles_admin_update RLS policy (admin role only — see
// lib/auth/requireAdmin.ts for why this is stricter than other admin+reviewer
// read policies elsewhere in the app).
export default function RoleSelect({
  profileId,
  role,
  isSelf,
}: {
  profileId: string;
  role: AppRole;
  isSelf: boolean;
}) {
  const [value, setValue] = useState<AppRole>(role);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: AppRole) {
    if (isSelf && next !== "admin") {
      setError("You can't remove your own admin access here.");
      return;
    }
    setValue(next);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update({ role: next }).eq("id", profileId);
      if (error) {
        setError("Couldn't save — try again.");
        setValue(role);
      }
    });
  }

  return (
    <div>
      <select
        value={value}
        disabled={isPending || isSelf}
        onChange={(e) => onChange(e.target.value as AppRole)}
        title={isSelf ? "You can't change your own role" : undefined}
        className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-primary focus:outline-none disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <div className="mt-1 text-[11.5px] text-destructive">{error}</div>}
    </div>
  );
}
