import { getAllTherapistsAdmin } from "@/lib/queries";
import { getAllTherapistViewSummaries } from "@/lib/analytics/therapistViews";
import TherapistAnalyticsTable from "@/components/admin/TherapistAnalyticsTable";

export const dynamic = "force-dynamic";

// Phase 206 — full, ranked therapist profile-view analytics page. Gated by
// app/admin/layout.tsx's requireAdmin() like every other /admin/** route;
// getAllTherapistViewSummaries()'s underlying RPC also independently checks
// auth_role() (see the phase_206 migration), so a non-admin can't get data
// back even by calling the RPC directly with a valid session.
//
// Phase 207 — "All-time" now reads from therapists.profile_views, the same
// public counter shown on every therapist card, per the explicit
// requirement that the CRM and the public site never show two different
// numbers for the same thing. today/week/month still come from the
// granular therapist_profile_views event table (getAllTherapistViewSummaries)
// since those breakdowns were never part of the public surface — both
// sources respect the same internal-user/self-view exclusions recorded at
// write time (see app/api/analytics/therapist-view/route.ts).
export default async function TherapistAnalyticsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [therapists, summaries] = await Promise.all([getAllTherapistsAdmin(), getAllTherapistViewSummaries()]);

  const rows = therapists.map((t) => {
    const s = summaries.get(t.id);
    return {
      id: t.id,
      name: t.full_name,
      slug: t.slug,
      photoUrl: t.photo_url,
      isActive: t.is_active,
      today: s?.todayCount ?? 0,
      week: s?.weekCount ?? 0,
      month: s?.monthCount ?? 0,
      allTime: t.profile_views ?? 0,
      lastViewedAt: s?.lastViewedAt ?? null,
    };
  });

  // Phase 206 — the eye-icon popover's "View full analytics" link passes
  // ?therapist=<id>; used here only to pre-fill the search box with that
  // therapist's name so this page opens already scoped to them, without a
  // second, separate "single therapist" route/component to maintain.
  const focusTherapistId = typeof searchParams?.therapist === "string" ? searchParams.therapist : undefined;
  const focusTherapist = focusTherapistId ? rows.find((r) => r.id === focusTherapistId) : undefined;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-lg">Professional Profile Analytics</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Privacy-conscious aggregate profile-view counts — never who viewed a profile, only how many unique
          anonymous visitors did, at most once per therapist per browser session. The All-time column matches
          the count shown publicly on the Our Professionals page.
        </p>
      </div>
      <TherapistAnalyticsTable initialRows={rows} initialSearch={focusTherapist?.name ?? ""} />
    </div>
  );
}
