import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Phase 186 — thin helper around `gesa_admin_audit_log`, a table that
// pre-dates this codebase (its existing rows are from a prior admin tool —
// see EXECUTION_PLAN.md Phase 186 for the full writeup) but has exactly the
// generic shape this phase's approve/create-profile/publish/archive actions
// need to record who did what, when, and why. Its RLS was locked down to
// admin-only insert as part of this same phase (it was previously wide
// open) — this helper always writes through the caller's own request-scoped
// Supabase client (never the service-role client), so that RLS is the real
// enforcement here too, not just this helper's good behavior.
//
// Deliberately swallow-and-log rather than throw: an audit-log write
// failing should never roll back or block the real action it's describing
// (e.g. a therapist profile that was successfully created shouldn't vanish
// just because the log entry about it failed to insert).
export async function logAdminAction(
  supabase: SupabaseClient,
  entry: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("gesa_admin_audit_log").insert({
    admin_id: entry.adminId,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId,
    metadata: entry.metadata ?? null,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error(`[adminAuditLog] failed to log "${entry.action}" on ${entry.targetType}:${entry.targetId}`, error);
  }
}
