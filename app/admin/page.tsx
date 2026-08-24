import Link from "next/link";
import {
  getAllBookingRequests,
  getAllGroupRegistrations,
  getAllInquiries,
  getAllMatchRequests,
  getAllProfiles,
  getAllSessionBookings,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

// Phase 60 — Roy sent a reference CRM dashboard mockup (gold background,
// KPI tiles, a monthly trend chart, a recent-activity table, two "Key
// Metrics" bar panels, a Users-by-role summary, and a scheduling calendar)
// and asked for the same structure here. Every number below comes from the
// same admin queries the rest of /admin already uses (lib/queries.ts) —
// nothing is placeholder data, including the trend chart and the calendar,
// which are both built from each item's real created_at/session_date.

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TREND_MONTHS = 6;

type ActivityItem = {
  type: string;
  href: string;
  label: string;
  email: string | null;
  createdAt: string;
  isNew: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.max(0, Math.round(ms / (1000 * 60 * 60)));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Buckets every activity item into the last TREND_MONTHS calendar months
// (oldest first), for the trend chart below.
function buildMonthlyTrend(items: ActivityItem[]) {
  const now = new Date();
  const buckets: { key: string; label: string; count: number }[] = [];
  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], count: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const item of items) {
    const d = new Date(item.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

// A calm inline SVG area chart — no charting library in this project, and
// this doesn't need one: it's one static, server-rendered polyline.
function TrendChart({ points }: { points: { label: string; count: number }[] }) {
  const width = 640;
  const height = 200;
  const padding = 24;
  const max = Math.max(1, ...points.map((p) => p.count));
  const step = (width - padding * 2) / Math.max(1, points.length - 1);

  const coords = points.map((p, i) => {
    const x = padding + i * step;
    const y = height - padding - (p.count / max) * (height - padding * 2);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${
    height - padding
  } Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full" role="img" aria-label="Monthly activity trend">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--clay)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--clay)" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendFill)" />
      <path d={linePath} fill="none" stroke="var(--amber)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c) => (
        <circle key={c.label} cx={c.x} cy={c.y} r={3.5} fill="var(--amber)" />
      ))}
      {coords.map((c) => (
        <text key={`${c.label}-label`} x={c.x} y={height + 18} textAnchor="middle" className="fill-[var(--muted-fg)] text-[11px]">
          {c.label}
        </text>
      ))}
    </svg>
  );
}

function MetricBar({ label, value, max, href }: { label: string; value: number; max: number; href: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <Link href={href} className="block">
      <div className="mb-1 flex items-center justify-between text-[13.5px]">
        <span className="text-primary/80">{label}</span>
        <span className="font-semibold text-primary">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-clay-soft">
        <div className="h-full rounded-full bg-amber" style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
      </div>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const [inquiries, bookings, registrations, profiles, matchRequests, sessionBookings] = await Promise.all([
    getAllInquiries(),
    getAllBookingRequests(),
    getAllGroupRegistrations(),
    getAllProfiles(),
    getAllMatchRequests(),
    getAllSessionBookings(),
  ]);

  const newBookings = bookings.filter((b) => b.status === "new").length;
  const newMatchRequests = matchRequests.filter((m) => m.status === "new").length;
  const confirmedSessions = sessionBookings.filter((s) => s.status === "confirmed").length;
  const roleCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1;
    return acc;
  }, {});

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newProfilesThisWeek = profiles.filter((p) => new Date(p.created_at).getTime() >= oneWeekAgo).length;

  const kpiTiles = [
    {
      label: "Session bookings",
      value: sessionBookings.length,
      sub: `${confirmedSessions} confirmed`,
      href: "/admin/sessions",
    },
    {
      label: "Find Your Therapist",
      value: matchRequests.length,
      sub: `${newMatchRequests} new`,
      href: "/admin/match-requests",
    },
    { label: "Booking requests", value: bookings.length, sub: `${newBookings} new`, href: "/admin/bookings" },
  ];

  // Phase 60 — a single normalized feed across every real submission type,
  // used for both the monthly trend chart and the "User Activity" table.
  // A window of 3 days decides the "New" pill — inquiries have no status
  // column of their own to key off, so recency is the one signal every
  // item type actually has.
  const isNew = (iso: string) => Date.now() - new Date(iso).getTime() < 3 * 24 * 60 * 60 * 1000;
  const activity: ActivityItem[] = [
    ...sessionBookings.map((s) => ({
      type: "Session booking",
      href: "/admin/sessions",
      label: `Session with ${s.therapist?.full_name ?? "a therapist"}`,
      email: s.client_email,
      createdAt: s.created_at,
      isNew: isNew(s.created_at),
    })),
    ...matchRequests.map((m) => ({
      type: "Find Your Therapist",
      href: "/admin/match-requests",
      label: "Find Your Therapist request",
      email: m.email,
      createdAt: m.created_at,
      isNew: m.status === "new",
    })),
    ...bookings.map((b) => ({
      type: "Booking request",
      href: "/admin/bookings",
      label: "Booking request",
      email: b.email,
      createdAt: b.created_at,
      isNew: b.status === "new",
    })),
    ...inquiries.map((i) => ({
      type: "Contact inquiry",
      href: "/admin/inquiries",
      label: i.type ? `Inquiry — ${i.type}` : "Contact inquiry",
      email: i.email,
      createdAt: i.created_at,
      isNew: isNew(i.created_at),
    })),
    ...registrations.map((r) => ({
      type: "Group registration",
      href: "/admin/registrations",
      label: "Group registration",
      email: r.email,
      createdAt: r.created_at,
      isNew: isNew(r.created_at),
    })),
  ];
  activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const trend = buildMonthlyTrend(activity);
  const recentActivity = activity.slice(0, 7);

  // Phase 60 — Scheduling Overview calendar: real session_bookings placed
  // on a real month grid by session_date, not sample data. Shows the
  // current calendar month.
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthLabel = `${MONTH_LABELS[today.getMonth()]} ${today.getFullYear()}`;

  const sessionsByDate = new Map<string, typeof sessionBookings>();
  for (const s of sessionBookings) {
    const list = sessionsByDate.get(s.session_date) ?? [];
    list.push(s);
    sessionsByDate.set(s.session_date, list);
  }
  const thisMonthSessions = sessionBookings.filter((s) => {
    const d = new Date(s.session_date);
    return d >= monthStart && d <= monthEnd;
  });

  const calendarCells: { date: Date | null; iso: string | null }[] = [];
  for (let i = 0; i < monthStart.getDay(); i++) calendarCells.push({ date: null, iso: null });
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const d = new Date(today.getFullYear(), today.getMonth(), day);
    calendarCells.push({ date: d, iso: d.toISOString().slice(0, 10) });
  }

  const requestBars = [
    { label: "Booking requests", value: bookings.length, href: "/admin/bookings" },
    { label: "Contact inquiries", value: inquiries.length, href: "/admin/inquiries" },
    { label: "Group registrations", value: registrations.length, href: "/admin/registrations" },
  ];
  const requestMax = Math.max(1, ...requestBars.map((b) => b.value));

  return (
    <div className="space-y-6">
      {/* KPI tiles — same three the reference highlights up top. Contact
          inquiries / Group registrations / Registered users moved into the
          "Requests"/"Community" panels below rather than duplicated here. */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpiTiles.map((t) => (
          <Link key={t.label} href={t.href} className="block">
            <div className="rounded-[var(--radius)] border border-white/50 bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
              <div className="text-[12px] font-bold uppercase tracking-wide text-muted-fg">{t.label}</div>
              <div className="mt-1.5 text-[32px] font-serif font-semibold text-primary">{t.value}</div>
              <div className="mt-0.5 text-[13px] text-clay">{t.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Trend */}
        <div className="rounded-[var(--radius)] border border-white/50 bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-lg text-primary">Trend</h2>
          <TrendChart points={trend} />
          <p className="mt-2 text-[12.5px] text-muted-fg">
            All submissions (sessions, Find Your Therapist, bookings, inquiries, group registrations) by month.
          </p>
        </div>

        {/* User Activity */}
        <div className="rounded-[var(--radius)] border border-white/50 bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-lg text-primary">User Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <Link
                key={`${item.type}-${item.createdAt}-${i}`}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-clay-soft/60"
              >
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-clay-soft text-[11px] font-semibold text-primary">
                  {initials(item.email ?? item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-primary">{item.label}</div>
                  <div className="truncate text-[12px] text-muted-fg">{item.email ?? "No email on file"}</div>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${
                      item.isNew ? "bg-amber-soft text-amber" : "bg-secondary text-muted-fg"
                    }`}
                  >
                    {item.isNew ? "New" : "Seen"}
                  </span>
                  <span className="text-[11px] text-muted-fg">{timeAgo(item.createdAt)}</span>
                </div>
              </Link>
            ))}
            {recentActivity.length === 0 && <p className="text-sm text-muted-fg">No activity yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-white/50 bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg text-primary">Requests</h2>
            <div className="space-y-4">
              {requestBars.map((b) => (
                <MetricBar key={b.label} label={b.label} value={b.value} max={requestMax} href={b.href} />
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius)] border border-white/50 bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg text-primary">Community</h2>
            <div className="mb-3">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-muted-fg">Registered users</div>
              <div className="mt-1 text-[28px] font-serif font-semibold text-primary">{profiles.length}</div>
              <div className="mt-0.5 text-[13px] text-clay">{newProfilesThisWeek} new this week</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleCounts).map(([role, count]) => (
                <span
                  key={role}
                  className="rounded-full border border-border bg-clay-soft/60 px-3 py-1 text-[12.5px] font-medium text-primary/80"
                >
                  {role}: <strong className="text-primary">{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduling Overview */}
        <div className="rounded-[var(--radius)] border border-white/50 bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg text-primary">Scheduling Overview</h2>
            <span className="text-[13px] text-muted-fg">{monthLabel}</span>
          </div>
          <div className="mb-4">
            <div className="text-[13px] font-semibold uppercase tracking-wide text-muted-fg">Session bookings this month</div>
            <div className="mt-1 text-[26px] font-serif font-semibold text-primary">{thisMonthSessions.length}</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-semibold uppercase text-muted-fg">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, i) => {
              const dayBookings = cell.iso ? sessionsByDate.get(cell.iso) ?? [] : [];
              const isToday = cell.iso === today.toISOString().slice(0, 10);
              return (
                <div
                  key={i}
                  className={`flex min-h-[46px] flex-col items-center rounded-lg p-1 text-[11px] ${
                    cell.date ? (isToday ? "bg-clay-soft" : "bg-secondary/40") : ""
                  }`}
                >
                  {cell.date && (
                    <>
                      <span className={`mb-0.5 ${isToday ? "font-bold text-primary" : "text-muted-fg"}`}>
                        {cell.date.getDate()}
                      </span>
                      {dayBookings.slice(0, 1).map((s) => (
                        <span
                          key={s.id}
                          className={`w-full truncate rounded px-1 text-[9.5px] ${
                            s.status === "confirmed" ? "bg-amber-soft text-amber" : "bg-secondary text-muted-fg line-through"
                          }`}
                        >
                          {s.session_time.slice(0, 5)}
                        </span>
                      ))}
                      {dayBookings.length > 1 && (
                        <span className="text-[9.5px] text-clay">+{dayBookings.length - 1} more</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
