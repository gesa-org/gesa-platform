"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, CalendarDays } from "lucide-react";

type SessionNotification = {
  id: string;
  full_name: string | null;
  session_format: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  status: string;
  created_at: string;
};

const FORMAT_LABEL: Record<string, string> = {
  online: "Online (Zoom)",
  call: "Call (WhatsApp)",
  in_person: "In-Person",
};

// Phase 208 — full-page counterpart to the header bell (components/admin/
// NotificationBell.tsx) for the new "Notifications" sidebar item. Reuses
// the exact same data source (/api/admin/support-requests/notifications,
// therapist branch — already scoped server-side to this signed-in
// therapist's own id, see that route) rather than adding a second query
// path, so this page and the bell can never show two different answers for
// "what's new." The bell itself is untouched by this phase — this is a
// read-only, additive view alongside it, plus the "View in Calendar" link
// the spec asks for on each item.
export default function TherapistNotificationsList() {
  const [items, setItems] = useState<SessionNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/support-requests/notifications")
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((data: { requests?: SessionNotification[] }) => {
        if (!cancelled) setItems(data.requests ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-[var(--radius)] border border-border bg-secondary/40" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center text-[14px] text-muted-fg">
        <Bell size={20} className="mx-auto mb-2 opacity-40" />
        Nothing here yet.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-[var(--radius)] border border-border bg-card p-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">New session booked — {item.full_name || "A client"}</span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11.5px] font-medium text-muted-fg">
              {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
          <p className="mb-3 text-[13px] text-muted-fg">
            {item.session_format ? FORMAT_LABEL[item.session_format] ?? item.session_format : "No format yet"}
            {item.preferred_date ? ` · ${item.preferred_date}` : ""}
            {item.preferred_time ? ` ${item.preferred_time}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Phase 208 — "View in Calendar" tries GESA's own internal
                Calendar/My Bookings first, per spec — this never links out
                to another therapist's data, since it's a fixed route to
                this signed-in therapist's own My Bookings page. */}
            <Link
              href="/therapist/bookings"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-primary transition-colors hover:bg-secondary"
            >
              <CalendarClock size={13} /> View in Calendar
            </Link>
            <Link
              href="/therapist/diary"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-primary transition-colors hover:bg-secondary"
            >
              <CalendarDays size={13} /> Open my diary
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
