import Link from "next/link";
import {
  getAllBookingRequests,
  getAllGroupRegistrations,
  getAllInquiries,
  getAllMatchRequests,
  getAllProfiles,
  getAllSessionBookings,
} from "@/lib/queries";
import SchedulingCalendar from "@/components/admin/SchedulingCalendar";
import type { CalendarEvent } from "@/lib/adminSchedule";

export const dynamic = "force-dynamic";

// Phase 60 — Roy sent a reference CRM dashboard mockup (gold background,
// KPI tiles, a monthly trend chart, a recent-activity table, two "Key
// Metrics" bar panels, a Users-by-role summary, and a scheduling calendar)
// and asked for the same structure here. Every number below comes from the
// same admin queries the rest of /admin already uses (lib/queries.ts) —
// nothing is placeholder data, including the trend chart and the calendar,
// which are both built from each item's real created_at/session_date.
//
// Phase 61 — Roy flagged the Phase 60 cards as too tall/empty (the grids
// were stretching every card in a row to match the tallest one — e.g. the
// short "Requests"/"Community" panels stretching to Scheduling Overview's
// full calendar height) and asked for a scrollable "User Activity" list
// (it will only grow over time) plus a "Scheduling Overview" that reflects
// every real date-bearing source on the site — sessions, Find Your
// Therapist requests, booking requests, contact inquiries, and group
// registrations — not just confirmed sessions.

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TREND_MONTHS = 6;
// Phase 61 — recent-activity list is now scrollable rather than a hard cutoff
// at 7 items, so it can afford to show a lot more before truncating.
const ACTIVITY_FEED_LIMIT = 40;

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
  const height = 130;
  const padding = 20;
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
  const recentActivity = activity.slice(0, ACTIVITY_FEED_LIMIT);

  // Phase 61 — Scheduling Overview now merges every real date-bearing
  // source on the site, not just confirmed sessions: session_bookings
  // (session_date), match_requests (preferred_date, when the client gave
  // one — otherwise created_at), booking_requests/inquiries/group
  // registrations (created_at — the schema has no separate appointment
  // date for these, so the date they were submitted is the honest date to
  // show). Shows the current calendar month.
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthLabel = `${MONTH_LABELS[today.getMonth()]} ${today.getFullYear()}`;
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const calendarEvents: CalendarEvent[] = [
    ...sessionBookings.map((s) => ({
      kind: "session" as const,
      dateIso: s.session_date,
      time: s.session_time.slice(0, 5),
      personLabel: `${s.client_name} with ${s.therapist?.full_name ?? "a therapist"}`,
      statusLabel: s.status,
      dotClass: s.status === "confirmed" ? "bg-amber" : "bg-muted-fg",
    })),
    ...matchRequests.map((m) => ({
      kind: "match" as const,
      dateIso: m.preferred_date ?? m.created_at.slice(0, 10),
      time: m.preferred_date ? m.preferred_time ?? null : null,
      personLabel: `${m.name} (${m.email})`,
      statusLabel: m.preferred_date ? m.status : `${m.status}, submitted`,
      dotClass: "bg-clay",
    })),
    ...bookings.map((b) => ({
      kind: "booking" as const,
      dateIso: b.created_at.slice(0, 10),
      time: null,
      personLabel: `${b.name} (${b.email})`,
      statusLabel: `${b.status}, submitted`,
      dotClass: "bg-accent",
    })),
    ...inquiries.map((i) => ({
      kind: "inquiry" as const,
      dateIso: i.created_at.slice(0, 10),
      time: null,
      personLabel: `${i.name ?? "Unknown"} (${i.email ?? "no email on file"})`,
      statusLabel: i.type ? `${i.type}, submitted` : "submitted",
      dotClass: "bg-primary/70",
    })),
    ...registrations.map((r) => ({
      kind: "registration" as const,
      dateIso: r.created_at.slice(0, 10),
      time: null,
      personLabel: `${r.name} (${r.email})`,
      statusLabel: "submitted",
      dotClass: "bg-primary-600",
    })),
  ];

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const e of calendarEvents) {
    (eventsByDate[e.dateIso] ??= []).push(e);
  }
  // Phase 63 fix — this used to compare `new Date(e.dateIso)` (parsed as
  // UTC midnight) against `monthStart`/`monthEnd` (local-midnight Date
  // objects), which is off by a day in any timezone behind UTC — the same
  // bug that made the calendar's day cells land on the wrong date (caught
  // by the new day-view test below actually opening a day and finding
  // yesterday's date in the heading). Every `dateIso` here is already a
  // plain "YYYY-MM-DD" string, so comparing its year-month prefix directly
  // avoids Date/timezone conversion entirely.
  const thisMonthEventCount = calendarEvents.filter((e) => e.dateIso.slice(0, 7) === currentYearMonth).length;

  // Plain { dayNumber, iso } cells rather than Date objects — this crosses
  // into a Client Component (SchedulingCalendar) below, and a Date isn't a
  // value worth risking on RSC's serialization boundary when a number and
  // an ISO string say the same thing and are unambiguously safe. `iso` is
  // built directly from the same local Y/M/D as `dayNumber` (not via
  // `Date#toISOString`, which converts to UTC and can land on the wrong
  // calendar day) so it lines up exactly with session_date/created_at
  // strings, which are never run through a local Date object either.
  const calendarCells: { dayNumber: number | null; iso: string | null }[] = [];
  for (let i = 0; i < monthStart.getDay(); i++) calendarCells.push({ dayNumber: null, iso: null });
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    calendarCells.push({ dayNumber: day, iso: `${currentYearMonth}-${String(day).padStart(2, "0")}` });
  }
  const todayIso = `${currentYearMonth}-${String(today.getDate()).padStart(2, "0")}`;

  const requestBars = [
    { label: "Booking requests", value: bookings.length, href: "/admin/bookings" },
    { label: "Contact inquiries", value: inquiries.length, href: "/admin/inquiries" },
    { label: "Group registrations", value: registrations.length, href: "/admin/registrations" },
  ];
  const requestMax = Math.max(1, ...requestBars.map((b) => b.value));

  return (
    <div className="space-y-5">
      {/* KPI tiles — same three the reference highlights up top. Contact
          inquiries / Group registrations / Registered users moved into the
          "Requests"/"Community" panels below rather than duplicated here. */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpiTiles.map((t) => (
          <Link key={t.label} href={t.href} className="block">
            <div className="rounded-[var(--radius)] border border-white/50 bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5">
              <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted-fg">{t.label}</div>
              <div className="mt-1 text-[26px] font-serif font-semibold text-primary">{t.value}</div>
              <div className="mt-0.5 text-[12.5px] text-clay">{t.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Phase 61 — `items-start` on every row below: Phase 60's grids had
          no alignment set, so `items-stretch` (the default) forced every
          card in a row to match the tallest one — the reason the shorter
          cards (Trend, Requests, Community) rendered with a lot of empty
          space beneath their real content. Each card now sizes to its own
          content instead. */}
      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Trend */}
        <div className="rounded-[var(--radius)] border border-white/50 bg-card p-5 shadow-soft">
          <h2 className="mb-3 text-base text-primary">Trend</h2>
          <TrendChart points={trend} />
          <p className="mt-2 text-[11.5px] text-muted-fg">
            All submissions (sessions, Find Your Therapist, bookings, inquiries, group registrations) by month.
          </p>
        </div>

        {/* User Activity — Phase 61: fixed-height + scrollable rather than
            a static list, since this will only keep growing. Shows up to
            ACTIVITY_FEED_LIMIT items inside the scroll area instead of the
            old hard cutoff at 7. */}
        <div className="rounded-[var(--radius)] border border-white/50 bg-card p-5 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base text-primary">User Activity</h2>
            <span className="text-[11.5px] text-muted-fg">{activity.length} total</span>
          </div>
          <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
            {recentActivity.map((item, i) => (
              <Link
                key={`${item.type}-${item.createdAt}-${i}`}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-clay-soft/60"
              >
                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-clay-soft text-[10.5px] font-semibold text-primary">
                  {initials(item.email ?? item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-primary">{item.label}</div>
                  <div className="truncate text-[11.5px] text-muted-fg">{item.email ?? "No email on file"}</div>
                </div>
                <div className="flex flex-none flex-col items-end gap-0.5">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      item.isNew ? "bg-amber-soft text-amber" : "bg-secondary text-muted-fg"
                    }`}
                  >
                    {item.isNew ? "New" : "Seen"}
                  </span>
                  <span className="text-[10.5px] text-muted-fg">{timeAgo(item.createdAt)}</span>
                </div>
              </Link>
            ))}
            {recentActivity.length === 0 && <p className="text-sm text-muted-fg">No activity yet.</p>}
          </div>
        </div>
      </div>

      {/* Requests / Community / Scheduling Overview — one row of three,
          matching the reference layout, each sized to its own content. */}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-white/50 bg-card p-5 shadow-soft">
          <h2 className="mb-3 text-base text-primary">Requests</h2>
          <div className="space-y-3">
            {requestBars.map((b) => (
              <MetricBar key={b.label} label={b.label} value={b.value} max={requestMax} href={b.href} />
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-white/50 bg-card p-5 shadow-soft">
          <h2 className="mb-3 text-base text-primary">Community</h2>
          <div className="mb-2.5">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-fg">Registered users</div>
            <div className="mt-0.5 text-[24px] font-serif font-semibold text-primary">{profiles.length}</div>
            <div className="mt-0.5 text-[12.5px] text-clay">{newProfilesThisWeek} new this week</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span
                key={role}
                className="rounded-full border border-border bg-clay-soft/60 px-2.5 py-1 text-[12px] font-medium text-primary/80"
              >
                {role}: <strong className="text-primary">{count}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Scheduling Overview — Phase 61 merged every real date-bearing
            source (sessions, Find Your Therapist, booking requests,
            inquiries, group registrations) onto the calendar. Phase 63:
            clicking a day now opens a full Google-Calendar-style day view
            (time, type, status, who) instead of only a hover tooltip — see
            SchedulingCalendar, a Client Component since it owns the
            "which day is open" state. */}
        <SchedulingCalendar
          monthLabel={monthLabel}
          todayIso={todayIso}
          thisMonthEventCount={thisMonthEventCount}
          calendarCells={calendarCells}
          eventsByDate={eventsByDate}
        />
      </div>
    </div>
  );
}
