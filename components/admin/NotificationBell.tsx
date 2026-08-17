"use client";

import { useEffect, useState } from "react";
import { Bell, X, Mail, CalendarClock, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  kind: "match" | "booking" | "inquiry" | "session";
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

// Role-gated: renders nothing for signed-out users or roles other than
// admin/therapist. Admin sees recent inquiries/bookings/match-requests
// site-wide; a therapist (once a real account is linked via
// therapists.profile_id — none exist yet in this environment, see
// EXECUTION_PLAN.md Phase 10) sees only their own upcoming session requests,
// enforced by the match_requests_therapist_read / booking_requests_therapist_read
// RLS policies, not by anything in this component.
export default function NotificationBell() {
  const [role, setRole] = useState<"admin" | "therapist" | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (cancelled) return;

      if (profile?.role === "admin") {
        setRole("admin");
        const [matches, bookings, inquiries] = await Promise.all([
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
        ]);

        const normalized: NotificationItem[] = [
          ...(matches.data ?? []).map((m) => ({
            id: `match-${m.id}`,
            kind: "match" as const,
            title: `New match request — ${m.name}`,
            subtitle: `${FORMAT_LABEL[m.session_format] ?? m.session_format}${
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (m as any).selected_therapist?.full_name ? ` · ${(m as any).selected_therapist.full_name}` : ""
            }`,
            createdAt: m.created_at,
            detail: m as unknown as Record<string, unknown>,
          })),
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
        ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

        if (!cancelled) setItems(normalized.slice(0, 10));
      } else if (profile?.role === "therapist") {
        const { data: therapist } = await supabase
          .from("therapists")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (!therapist) return;
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
        if (!cancelled) setItems(normalized);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!role) return null;

  const newCount = items.filter((i) => i.detail.status === "new" || role === "therapist").length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-secondary"
        title={newCount > 0 ? `${newCount} notification${newCount === 1 ? "" : "s"}` : "No new notifications"}
      >
        <Bell size={18} />
        {newCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10.5px] font-bold text-white">
            {newCount > 9 ? "9+" : newCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 max-h-[420px] w-[320px] overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3 text-[13px] font-semibold text-muted-fg">
            {role === "admin" ? "Recent activity" : "Your upcoming sessions"}
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13.5px] text-muted-fg">Nothing here yet.</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2.5 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary"
              >
                <span className="mt-0.5 flex-none text-primary">
                  {item.kind === "inquiry" && <Mail size={15} />}
                  {(item.kind === "match" || item.kind === "session") && <CalendarClock size={15} />}
                  {item.kind === "booking" && <Users2 size={15} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-foreground">{item.title}</span>
                  <span className="block truncate text-[12px] text-muted-fg">{item.subtitle}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {selected && <NotificationDetailModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function NotificationDetailModal({ item, onClose }: { item: NotificationItem; onClose: () => void }) {
  const d = item.detail as Record<string, unknown> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected_therapist?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matched_therapist?: any;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-[var(--radius)] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[18px]">{item.title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-fg hover:bg-secondary" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2.5 text-[14px]">
          {typeof d.name === "string" && (
            <div>
              <span className="font-semibold">Name: </span>
              {d.name}
            </div>
          )}
          {typeof d.email === "string" && (
            <div>
              <span className="font-semibold">Email: </span>
              <a href={`mailto:${d.email}`} className="text-primary underline">
                {d.email}
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
          {(d.selected_therapist?.full_name || d.matched_therapist?.full_name) && (
            <div>
              <span className="font-semibold">Selected therapist: </span>
              {d.selected_therapist?.full_name ?? d.matched_therapist?.full_name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
