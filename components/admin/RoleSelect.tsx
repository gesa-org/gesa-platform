"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/database.types";

// Phase 187 — "admin", "super_admin", and "therapist" removed from this
// direct dropdown. Those three roles now require going through the
// invitation flow (Administrators page / Our Professionals "Send
// invitation") instead of an instant role flip here — see
// app/api/admin/users/route.ts's own comment for the same reasoning applied
// to account creation.
const EDITABLE_ROLES: AppRole[] = ["reviewer", "client", "finance"];
const PROTECTED_ROLES = new Set<AppRole>(["admin", "super_admin", "therapist"]);

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

  // Phase 187 — a row whose CURRENT role is admin/super_admin/therapist is
  // shown as a plain read-only label, not a dropdown that would otherwise
  // have to either omit the option it's currently set to (an invalid <select
  // value>) or let it be picked again as if it were a normal, instantly-
  // reversible toggle. Changing *out of* one of these roles still isn't
  // possible from here on purpose — see the Administrators page for
  // Administrator/Super Admin, and Our Professionals' account-status actions
  // for Professional.
  if (PROTECTED_ROLES.has(role)) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[13px] font-medium text-muted-fg"
        title="Managed from the Administrators page or Our Professionals, not here."
      >
        {role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Professional"}
      </span>
    );
  }

  function onChange(next: AppRole) {
    if (isSelf) {
      setError("You can't change your own role here.");
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
        {EDITABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <div className="mt-1 text-[11.5px] text-destructive">{error}</div>}
    </div>
  );
}
