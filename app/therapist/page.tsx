import { CalendarClock, ExternalLink, Mail } from "lucide-react";
import { requireTherapist } from "@/lib/auth/requireTherapist";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  zoom: "Zoom",
};

// Roy's spec asked for a therapist-facing view of "their own bookings and
// diary handoffs" — this page is exactly that, nothing more: two lists,
// each scoped to this therapist's own `id`. Both queries add an explicit
// `.eq("therapist_id", ...)` on top of what `session_bookings_therapist_read`
// / `diary_events_therapist_read` RLS already enforces — defense-in-depth,
// same reasoning as every admin query elsewhere in this codebase (RLS is
// the real enforcement; the query-level filter means this page can never
// accidentally show someone else's rows even if a future RLS change were
// buggy).
export default async function TherapistDashboardPage() {
  const self = await requireTherapist();

  if (!self) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-1.5 text-lg">Your account isn&apos;t linked to a professional profile yet</h2>
        <p className="text-[14px] text-muted-fg">
          This login exists, but no professional record points to it yet. Contact the GESA team so an admin can
          link your account from your profile&apos;s edit page.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: sessionBookings }, { data: diaryEvents }] = await Promise.all([
    supabase
      .from("session_bookings")
      .select("id, client_name, session_date, session_time, contact_channel, status, created_at")
      .eq("therapist_id", self.therapist.id)
      .order("session_date", { ascending: true })
      .order("session_time", { ascending: true }),
    supabase
      .from("diary_scheduling_events")
      .select("id, client_name, client_email, created_at, status")
      .eq("therapist_id", self.therapist.id)
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (sessionBookings ?? []) as Pick<
    Tables<"session_bookings">,
    "id" | "client_name" | "session_date" | "session_time" | "contact_channel" | "status" | "created_at"
  >[];
  const diaryHandoffs = (diaryEvents ?? []) as Pick<
    Tables<"diary_scheduling_events">,
    "id" | "client_name" | "client_email" | "created_at" | "status"
  >[];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.session_date >= today && b.status === "confirmed");
  const past = bookings.filter((b) => b.session_date < today || b.status !== "confirmed");

  return (
    <div className="flex flex-col gap-6">
      {!self.therapist.is_active && (
        <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-[13.5px] text-muted-fg">
          Your profile isn&apos;t currently visible in the public directory. If that doesn&apos;t look right,
          reach out to the GESA team.
        </div>
      )}

      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg">
          <CalendarClock size={18} className="text-primary" /> Upcoming sessions
        </h2>
        <p className="mb-4 text-[13px] text-muted-fg">
          Real, reserved slots from clients who used the built-in date/time picker — each one is guaranteed
          conflict-free.
        </p>
        {upcoming.length === 0 ? (
          <p className="text-[14px] text-muted-fg">No upcoming sessions right now.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">{b.client_name}</div>
                  <div className="text-[13px] text-muted-fg">
                    {b.session_date} at {b.session_time.slice(0, 5)} · {CHANNEL_LABEL[b.contact_channel] ?? b.contact_channel}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg">
          <ExternalLink size={18} className="text-primary" /> Scheduling-link activity
        </h2>
        <p className="mb-4 text-[13px] text-muted-fg">
          Clients who were sent to your own scheduling link. GESA has no way to confirm they actually picked a
          time — check your own calendar for the real outcome. &quot;Opened&quot; means the link was sent, not
          that a session is booked.
        </p>
        {diaryHandoffs.length === 0 ? (
          <p className="text-[14px] text-muted-fg">No scheduling-link activity yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {diaryHandoffs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">{d.client_name || "A GESA client"}</div>
                  {d.client_email && (
                    <div className="flex items-center gap-1 text-[13px] text-muted-fg">
                      <Mail size={12} /> {d.client_email}
                    </div>
                  )}
                  <div className="text-[12.5px] text-muted-fg">
                    {new Date(d.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[12px] font-medium capitalize text-muted-fg">
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          <h2 className="mb-1 text-lg">Past &amp; other requests</h2>
          <p className="mb-4 text-[13px] text-muted-fg">
            Earlier or non-confirmed session requests, for your records.
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {past.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">{b.client_name}</div>
                  <div className="text-[13px] text-muted-fg">
                    {b.session_date} at {b.session_time.slice(0, 5)}
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[12px] font-medium capitalize text-muted-fg">
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
