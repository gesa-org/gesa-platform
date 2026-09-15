import { createClient } from "@/lib/supabase/server";

// Phase 206 — server-side read helpers for therapist profile-view
// analytics, following lib/queries.ts's own convention: plain functions
// using the signed-in user's own cookie-based client (never the
// service-role client for reads), relying on RLS/the RPC's own internal
// auth_role() check as the real enforcement. Every RPC call here returns an
// empty result for a non-admin caller rather than throwing — see the
// phase_206 migration's own comment on why.

export type TherapistViewSummary = {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  allTimeCount: number;
  lastViewedAt: string | null;
};

const EMPTY_SUMMARY: TherapistViewSummary = {
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
  allTimeCount: 0,
  lastViewedAt: null,
};

// One therapist's full summary — backs the eye-icon popover's detail view
// and (indirectly, via getAllTherapistViewSummaries below) the compact
// card badge.
export async function getTherapistViewSummary(therapistId: string): Promise<TherapistViewSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_therapist_view_summary", { p_therapist_id: therapistId });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return EMPTY_SUMMARY;
  return {
    todayCount: row.today_count,
    weekCount: row.week_count,
    monthCount: row.month_count,
    allTimeCount: row.all_time_count,
    lastViewedAt: row.last_viewed_at,
  };
}

// Every therapist's summary in one round trip — backs the /therapists
// directory's admin-only eye-icon badges (today+week per card) and the
// full /admin/therapist-analytics table. Returned as a Map keyed by
// therapist id for O(1) lookup while rendering the card grid/table.
export async function getAllTherapistViewSummaries(): Promise<Map<string, TherapistViewSummary>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_all_therapist_view_summaries");
  if (error) throw error;
  const map = new Map<string, TherapistViewSummary>();
  for (const row of data ?? []) {
    map.set(row.therapist_id, {
      todayCount: row.today_count,
      weekCount: row.week_count,
      monthCount: row.month_count,
      allTimeCount: row.all_time_count,
      lastViewedAt: row.last_viewed_at,
    });
  }
  return map;
}

export type DailyViewBucket = { day: string; count: number };

// Last N days' daily counts — backs the eye-icon popover's mini chart.
export async function getTherapistViewDailyBreakdown(therapistId: string, days = 7): Promise<DailyViewBucket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_therapist_view_daily_breakdown", {
    p_therapist_id: therapistId,
    p_days: days,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({ day: row.day, count: row.view_count }));
}
