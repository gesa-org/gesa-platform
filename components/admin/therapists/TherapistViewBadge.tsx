"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, X, Loader2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Detail = {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  allTimeCount: number;
  lastViewedAt: string | null;
  daily: { day: string; count: number }[];
};

// Phase 206 — admin-only eye icon + compact analytics popover, shown on
// every therapist card on /therapists. This component is only ever
// rendered for a signed-in admin/super_admin in the first place (see
// TherapistCard.tsx: the `viewStats` prop it needs is only fetched/passed
// by app/therapists/page.tsx when the requester is an admin) — a public
// visitor's server render never includes this component or its data at
// all, not just a CSS-hidden version of it.
export default function TherapistViewBadge({
  therapistId,
  therapistName,
  therapistPhotoUrl,
  today,
  week,
}: {
  therapistId: string;
  therapistName: string;
  therapistPhotoUrl: string | null;
  today: number;
  week: number;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || detail || loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    Promise.all([
      supabase.rpc("get_therapist_view_summary", { p_therapist_id: therapistId }),
      supabase.rpc("get_therapist_view_daily_breakdown", { p_therapist_id: therapistId, p_days: 7 }),
    ])
      .then(([summaryRes, dailyRes]) => {
        if (summaryRes.error) throw summaryRes.error;
        if (dailyRes.error) throw dailyRes.error;
        const row = summaryRes.data?.[0];
        setDetail({
          todayCount: row?.today_count ?? 0,
          weekCount: row?.week_count ?? 0,
          monthCount: row?.month_count ?? 0,
          allTimeCount: row?.all_time_count ?? 0,
          lastViewedAt: row?.last_viewed_at ?? null,
          daily: (dailyRes.data ?? []).map((d) => ({ day: d.day, count: d.view_count })),
        });
      })
      .catch(() => setError("Couldn't load analytics — try again."))
      .finally(() => setLoading(false));
  }, [open, detail, loading, therapistId]);

  const maxDaily = detail ? Math.max(1, ...detail.daily.map((d) => d.count)) : 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View analytics for ${therapistName}`}
        title={`${today} unique profile visit${today === 1 ? "" : "s"} today. ${week} this week.`}
        className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#1a1a1a]/70 px-2.5 py-1 text-[11.5px] font-semibold text-white shadow-soft transition-colors hover:bg-[#1a1a1a]/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Eye size={13} aria-hidden="true" /> {today} today
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Profile-view analytics for ${therapistName}`}
        >
          <div
            className="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 flex-none overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
                  {therapistPhotoUrl ? (
                    <Image src={therapistPhotoUrl} alt="" fill className="object-cover" sizes="44px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-white">
                      {therapistName
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                </div>
                <h3 className="text-[16px] font-semibold">{therapistName}</h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-fg hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <X size={18} />
              </button>
            </div>

            {loading && !detail && (
              <div className="flex items-center gap-2 py-6 text-[13.5px] text-muted-fg">
                <Loader2 size={16} className="animate-spin" /> Loading analytics…
              </div>
            )}

            {error && <p className="py-4 text-[13.5px] text-destructive">{error}</p>}

            {detail && (
              <>
                <div className="grid grid-cols-2 gap-3 text-center">
                  {[
                    { label: "Today", value: detail.todayCount },
                    { label: "This week", value: detail.weekCount },
                    { label: "This month", value: detail.monthCount },
                    { label: "All time", value: detail.allTimeCount },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border bg-secondary/40 p-3">
                      <div className="text-[20px] font-semibold text-primary">{stat.value}</div>
                      <div className="text-[11.5px] uppercase tracking-wide text-muted-fg">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {detail.daily.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">
                      Last 7 days
                    </div>
                    <div className="flex h-16 items-end gap-1.5" role="img" aria-label="Daily profile views, last 7 days">
                      {detail.daily.map((d) => (
                        <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t bg-primary/70"
                            style={{ height: `${Math.max(4, (d.count / maxDaily) * 48)}px` }}
                            title={`${d.count} view${d.count === 1 ? "" : "s"} on ${d.day}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-4 text-[12px] text-muted-fg">
                  {detail.lastViewedAt
                    ? `Last viewed ${new Date(detail.lastViewedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC`
                    : "No profile views yet"}
                </p>
              </>
            )}

            <div className="mt-5 border-t border-border pt-4">
              <Link
                href={`/admin/therapist-analytics?therapist=${therapistId}`}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:underline"
              >
                View full analytics <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
