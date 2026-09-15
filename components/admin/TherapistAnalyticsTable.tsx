"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Download, Eye } from "lucide-react";

type Row = {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  isActive: boolean;
  today: number;
  week: number;
  month: number;
  allTime: number;
  lastViewedAt: string | null;
};

type DateRange = "today" | "7days" | "30days";
type SortOption = "most_viewed" | "least_viewed" | "name_asc";

const RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  "7days": "Last 7 days",
  "30days": "Last 30 days",
};

// Maps the date-range selector to the row field it emphasizes for
// sorting/filtering. A true arbitrary "Custom" range would need its own
// per-therapist aggregation query (the fixed today/week/month/all-time
// columns are the only ones computed server-side) — deliberately left as a
// follow-up (see EXECUTION_PLAN.md's Phase 206 assumptions) rather than
// bolted on as something that only half-works.
const RANGE_FIELD: Record<DateRange, keyof Row> = {
  today: "today",
  "7days": "week",
  "30days": "month",
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

// Phase 206 — the full ranked analytics table. All aggregate counts are
// already computed server-side (see get_all_therapist_view_summaries in the
// phase_206 migration) — this component only searches/sorts/filters the
// already-small resulting rows client-side, the same "fetch once, manage
// locally" shape as SessionBookingsTable/TherapistsTable.
export default function TherapistAnalyticsTable({
  initialRows,
  initialSearch = "",
}: {
  initialRows: Row[];
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [range, setRange] = useState<DateRange>("today");
  const [sort, setSort] = useState<SortOption>("most_viewed");
  const [showZero, setShowZero] = useState(true);

  const filtered = useMemo(() => {
    const rangeField = RANGE_FIELD[range];
    let rows = initialRows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    if (!showZero) rows = rows.filter((r) => (r[rangeField] as number) > 0);

    const sorted = [...rows];
    if (sort === "name_asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Phase 206 spec: "Default sort: highest number of visits today, then
      // highest weekly visits." Generalized here to "highest in the
      // selected range, then highest weekly" so the tie-break still makes
      // sense when a different range tab is active; reversed for
      // "Least viewed."
      sorted.sort((a, b) => {
        const primary = (b[rangeField] as number) - (a[rangeField] as number);
        if (primary !== 0) return sort === "least_viewed" ? -primary : primary;
        const secondary = b.week - a.week;
        return sort === "least_viewed" ? -secondary : secondary;
      });
    }
    return sorted;
  }, [initialRows, search, range, sort, showZero]);

  function exportCsv() {
    const header = ["Therapist", "Today", "This week", "This month", "All time", "Last viewed (UTC)"];
    const lines = filtered.map((r) =>
      [
        r.name,
        String(r.today),
        String(r.week),
        String(r.month),
        String(r.allTime),
        r.lastViewedAt ? new Date(r.lastViewedAt).toISOString() : "",
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `therapist-profile-views-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-fg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by therapist name…"
            aria-label="Search by therapist name"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-[14px] focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
          {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                range === r ? "bg-primary text-white" : "text-muted-fg hover:text-primary"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          aria-label="Sort"
          className="rounded-full border border-border bg-card px-3.5 py-2.5 text-[13.5px] focus:border-primary focus:outline-none"
        >
          <option value="most_viewed">Most viewed</option>
          <option value="least_viewed">Least viewed</option>
          <option value="name_asc">Name A–Z</option>
        </select>

        <label className="flex items-center gap-1.5 text-[12.5px] text-muted-fg">
          <input type="checkbox" checked={showZero} onChange={(e) => setShowZero(e.target.checked)} />
          Show zero-view therapists
        </label>

        <button
          type="button"
          onClick={exportCsv}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[13px] font-medium text-primary hover:bg-secondary"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-[13.5px] text-muted-fg">
          {initialRows.length === 0 ? "No profile views yet." : "No therapists match your search/filters."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius)] border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="px-5 py-3">Therapist</th>
                  <th className="px-5 py-3">Today</th>
                  <th className="px-5 py-3">This week</th>
                  <th className="px-5 py-3">This month</th>
                  <th className="px-5 py-3">All time</th>
                  <th className="px-5 py-3">Last viewed</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border align-middle">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 flex-none overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent">
                          {r.photoUrl ? (
                            <Image src={r.photoUrl} alt="" fill className="object-cover" sizes="32px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white">
                              {r.name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{r.name}</div>
                          {!r.isActive && <div className="text-[11.5px] text-muted-fg">Inactive</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold">{r.today}</td>
                    <td className="px-5 py-3">{r.week}</td>
                    <td className="px-5 py-3">{r.month}</td>
                    <td className="px-5 py-3">{r.allTime}</td>
                    <td className="px-5 py-3 text-[12.5px] text-muted-fg">
                      {r.lastViewedAt
                        ? new Date(r.lastViewedAt).toLocaleString("en-US", { timeZone: "UTC" })
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/therapists/${r.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
                      >
                        <Eye size={13} /> View profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
