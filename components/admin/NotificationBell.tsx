"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X, Mail, CalendarClock, Users2, CalendarCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NotificationKind = "match" | "booking" | "inquiry" | "session" | "sessionBooking";

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  createdAt: string;
  detail: Record<string, unknown>;
};

const FORMAT_LABEL: Record<string, string> = {
  online: "Online (Zoom)",
  call: "Call (WhatsApp)",
  in_person: "In-Person",
};

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  zoom: "Zoom",
};

const PATH_LABEL: Record<string, string> = {
  crisis: "In crisis right now",
  veteran: "Veterans, reservists & families",
  general: "Seeking support",
  helpers: "Helping the helpers",
  directory: "Our Therapists directory",
};

const KIND_STYLE: Record<NotificationKind, { icon: typeof Mail; bg: string; fg: string }> = {
  inquiry: { icon: Mail, bg: "bg-secondary", fg: "text-muted-fg" },
  match: { icon: CalendarClock, bg: "bg-accent-soft", fg: "text-primary" },
  booking: { icon: Users2, bg: "bg-accent-soft", fg: "text-primary" },
  sessionBooking: { icon: CalendarCheck2, bg: "bg-primary/10", fg: "text-primary" },
  session: { icon: CalendarClock, bg: "bg-accent-soft", fg: "text-primary" },
};

const LAST_SEEN_KEY = "gesa-admin-notifications-last-seen";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Role-gated: renders nothing for signed-out users or roles other than
// admin/therapist. Admin sees recent inquiries/bookings/match-requests/
// session bookings site-wide; a therapist (once a real account is linked via
// therapists.profile_id — none exist yet in this environment, see
// EXECUTION_PLAN.md Phase 10) sees only their own upcoming session requests,
// enforced by the match_requests_therapist_read / booking_requests_therapist_read
// RLS policies, not by anything in this component.
export default function NotificationBell() {
  const [role, setRole] = useState<"admin" | "therapist" | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastSeen(typeof window !== "undefined" ? localStorage.getItem(LAST_SEEN_KEY) : null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (cancelled) return;

      if (profile?.role === "admin") {
        setRole("admin");
        const [matches, bookings, inquiries, sessionBookings] = await Promise.all([
          supabase
            .from("match_requests")
            .select("id, name, email, session_format, status, created_at, selected_therapist:therapists(full_name)")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("booking_requests")
            .select("id, name, email, entry_route, status, created_at, matched_therapist:therapists(full_name)")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("inquiries")
            .select("id, name, email, type, message, created_at")
            .order("created_at", { ascending: false })
            .limit(8),
          // Session bookings (Phase 20's real, conflict-free reservations) were
          // previously missing from this feed entirely — a booking could show
          // up in /admin/sessions with no corresponding notification here.
          supabase
            .from("session_bookings")
            .select(
              "id, client_name, client_email, session_date, session_time, contact_channel, path, status, created_at, therapist:therapists(full_name)"
            )
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        const normalized: NotificationItem[] = [
          ...(matches.data ?? []).map((m) => {
            const matchTherapistName = (m as { selected_therapist?: { full_name?: string | null } | null })
              .selected_therapist?.full_name;
            return {
              id: `match-${m.id}`,
              kind: "match" as const,
              title: `New match request — ${m.name}`,
              subtitle: `${FORMAT_LABEL[m.session_format] ?? m.session_format}${
                matchTherapistName ? ` · ${matchTherapistName}` : ""
              }`,
              createdAt: m.created_at,
              detail: m as unknown as Record<string, unknown>,
            };
          }),
          ...(bookings.data ?? []).map((b) => ({
            id: `booking-${b.id}`,
            kind: "booking" as const,
            title: `New booking request — ${b.name}`,
            subtitle: b.entry_route,
            createdAt: b.created_at,
            detail: b as unknown as Record<string, unknown>,
          })),
          ...(inquiries.data ?? []).map((i) => ({
            id: `inquiry-${i.id}`,
            kind: "inquiry" as const,
            title: `New inquiry — ${i.name ?? "Anonymous"}`,
            subtitle: i.type ?? "General",
            createdAt: i.created_at,
            detail: i as unknown as Record<string, unknown>,
          })),
          ...(sessionBookings.data ?? []).map((s) => {
            const therapistName = (s as { therapist?: { full_name?: string | null } | null }).therapist?.full_name;
            return {
              id: `sessionBooking-${s.id}`,
              kind: "sessionBooking" as const,
              title: `New session booked — ${s.client_name}`,
              subtitle: `${s.session_date} · ${s.session_time.slice(0, 5)}${
                therapistName ? ` · ${therapistName}` : ""
              }`,
              createdAt: s.created_at,
              detail: s as unknown as Record<string, unknown>,
            };
          }),
        ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

        if (!cancelled) {
          setItems(normalized.slice(0, 10));
          setLoading(false);
        }
      } else if (profile?.role === "therapist") {
        const { data: therapist } = await supabase
          .from("therapists")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (!therapist) {
          if (!cancelled) setLoading(false);
          return;
        }
        setRole("therapist");

        const { data: sessions } = await supabase
          .from("match_requests")
          .select("id, name, session_format, preferred_date, preferred_time, status, created_at")
          .eq("selected_therapist_id", therapist.id)
          .order("created_at", { ascending: false })
          .limit(10);

        const normalized: NotificationItem[] = (sessions ?? []).map((s) => ({
          id: `session-${s.id}`,
          kind: "session" as const,
          title: `New session booked — ${s.name}`,
          subtitle: `${FORMAT_LABEL[s.session_format] ?? s.session_format}${
            s.preferred_date ? ` · ${s.preferred_date}` : ""
          }${s.preferred_time ? ` ${s.preferred_time}` : ""}`,
          createdAt: s.created_at,
          detail: s as unknown as Record<string, unknown>,
        }));
        if (!cancelled) {
          setItems(normalized);
          setLoading(false);
        }
      } else if (!cancelled) {
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Click-outside-to-close: previously the only way to close the dropdown
  // was clicking a notification or the bell itself — clicking anywhere else
  // on the page left it open indefinitely.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (!role) return null;

  // "Unread" is now based on when the bell was last opened, not on a
  // per-table status column — status enums differ across match_requests/
  // booking_requests/inquiries/session_bookings, so an admin's badge count
  // used to under- or over-count depending on which table an item came from,
  // and a therapist's count never went down at all.
  const newCount = lastSeen ? items.filter((i) => +new Date(i.createdAt) > +new Date(lastSeen)).length : items.length;

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        const now = new Date().toISOString();
        localStorage.setItem(LAST_SEEN_KEY, now);
        setLastSeen(now);
      }
      return next;
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={newCount > 0 ? `${newCount} new notification${newCount === 1 ? "" : "s"}` : "Notifications"}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-secondary"
      >
        <Bell size={18} />
        {newCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10.5px] font-bold text-white">
            {newCount > 9 ? "9+" : newCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 flex max-h-[460px] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[13px] font-semibold text-muted-fg">
              {role === "admin" ? "Recent activity" : "Your upcoming sessions"}
            </span>
            {role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-[12px] font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            )}
          </div>

          <div className="overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-3 px-4 py-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 animate-pulse">
                    <div className="h-7 w-7 flex-none rounded-full bg-secondary" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-3/4 rounded bg-secondary" />
                      <div className="h-2.5 w-1/2 rounded bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13.5px] text-muted-fg">
                <Bell size={20} className="mx-auto mb-2 opacity-40" />
                Nothing here yet.
              </div>
            ) : (
              items.map((item) => {
                const style = KIND_STYLE[item.kind];
                const Icon = style.icon;
                const isUnread = lastSeen ? +new Date(item.createdAt) > +new Date(lastSeen) : true;
                return (
                  <button
                    key={item.id}
                    role="menuitem"
                    onClick={() => {
                      setSelected(item);
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-2.5 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary"
                  >
                    <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full ${style.bg} ${style.fg}`}>
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="block truncate text-[13.5px] font-medium text-foreground">{item.title}</span>
                        {isUnread && <span className="h-1.5 w-1.5 flex-none rounded-full bg-primary" />}
                      </span>
                      <span className="block truncate text-[12px] text-muted-fg">{item.subtitle}</span>
                    </span>
                    <span className="flex-none whitespace-nowrap text-[11px] text-muted-fg">{timeAgo(item.createdAt)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {selected && <NotificationDetailModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function NotificationDetailModal({ item, onClose }: { item: NotificationItem; onClose: () => void }) {
  const d = item.detail as Record<string, unknown> & {
    selected_therapist?: { full_name?: string | null } | null;
    matched_therapist?: { full_name?: string | null } | null;
    therapist?: { full_name?: string | null } | null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-[var(--radius)] bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[18px]">{item.title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-fg hover:bg-secondary" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2.5 text-[14px]">
          <div>
            <span className="font-semibold">Received: </span>
            {new Date(item.createdAt).toLocaleString()}
          </div>
          {(typeof d.name === "string" || typeof d.client_name === "string") && (
            <div>
              <span className="font-semibold">Name: </span>
              {(d.name as string) ?? (d.client_name as string)}
            </div>
          )}
          {(typeof d.email === "string" || typeof d.client_email === "string") && (
            <div>
              <span className="font-semibold">Email: </span>
              <a href={`mailto:${(d.email as string) ?? (d.client_email as string)}`} className="text-primary underline">
                {(d.email as string) ?? (d.client_email as string)}
              </a>
            </div>
          )}
          {typeof d.message === "string" && (
            <div>
              <span className="font-semibold">Message: </span>
              {d.message}
            </div>
          )}
          {typeof d.session_format === "string" && (
            <div>
              <span className="font-semibold">Format: </span>
              {FORMAT_LABEL[d.session_format] ?? d.session_format}
            </div>
          )}
          {typeof d.entry_route === "string" && (
            <div>
              <span className="font-semibold">Entry route: </span>
              {d.entry_route}
            </div>
          )}
          {(typeof d.preferred_date === "string" || typeof d.preferred_time === "string") && (
            <div>
              <span className="font-semibold">Requested time: </span>
              {[d.preferred_date, d.preferred_time].filter(Boolean).join(" ")}
            </div>
          )}
          {typeof d.session_date === "string" && (
            <div>
              <span className="font-semibold">Booked for: </span>
              {d.session_date}
              {typeof d.session_time === "string" ? ` at ${(d.session_time as string).slice(0, 5)}` : ""}
            </div>
          )}
          {typeof d.contact_channel === "string" && (
            <div>
              <span className="font-semibold">Contact via: </span>
              {CHANNEL_LABEL[d.contact_channel] ?? d.contact_channel}
            </div>
          )}
          {typeof d.path === "string" && (
            <div>
              <span className="font-semibold">Entered via: </span>
              {PATH_LABEL[d.path] ?? d.path}
            </div>
          )}
          {(d.selected_therapist?.full_name || d.matched_therapist?.full_name || d.therapist?.full_name) && (
            <div>
              <span className="font-semibold">Therapist: </span>
              {d.selected_therapist?.full_name ?? d.matched_therapist?.full_name ?? d.therapist?.full_name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
