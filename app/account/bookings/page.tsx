import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/auth/requireUser";
import { getMyBookings } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  zoom: "Zoom",
  in_person: "In person",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

// Phase 179 — client-facing counterpart to app/therapist/page.tsx's own
// bookings list. Only ever shows bookings whose client_profile_id matches
// this signed-in account (see session_bookings_client_read RLS policy and
// getMyBookings() in lib/queries.ts) — a booking made as a guest, under a
// different email, or before this phase shipped simply won't appear here,
// since there is nothing linking it to this account.
export default async function MyBookingsPage() {
  const profile = await requireUser("/account/bookings");
  const bookings = await getMyBookings(profile.id);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.session_date >= today && b.status === "confirmed");
  const past = bookings.filter((b) => b.session_date < today || b.status !== "confirmed");

  return (
    <section className="section wrap max-w-[640px]">
      <Link href="/account" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-fg hover:text-primary">
        <ArrowLeft size={14} /> Back to My Account
      </Link>
      <span className="eyebrow">Your account</span>
      <h1 className="mb-2 text-[30px]">My Bookings</h1>
      <p className="mb-7 text-muted-fg">
        Session bookings you&apos;ve made while signed in. If you booked as a guest under this same email before
        creating an account, it may not show up here — contact GESA support if something&apos;s missing.
      </p>

      <div className="mb-6 rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg">
          <CalendarClock size={18} className="text-primary" /> Upcoming sessions
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-[14px] text-muted-fg">No upcoming sessions right now.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">{b.therapist?.full_name ?? "Your therapist"}</div>
                  <div className="text-[13px] text-muted-fg">
                    {b.session_date} at {b.session_time.slice(0, 5)} · {CHANNEL_LABEL[b.contact_channel] ?? b.contact_channel}
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[12px] font-medium text-muted-fg">
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          <h2 className="mb-1 text-lg">Past &amp; other bookings</h2>
          <ul className="flex flex-col divide-y divide-border">
            {past.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">{b.therapist?.full_name ?? "Your therapist"}</div>
                  <div className="text-[13px] text-muted-fg">
                    {b.session_date} at {b.session_time.slice(0, 5)}
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[12px] font-medium text-muted-fg">
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="rounded-[var(--radius)] border border-border bg-card p-6 text-center">
          <p className="text-[14px] text-muted-fg">
            You don&apos;t have any bookings linked to this account yet. Once you book a session while signed in,
            it&apos;ll show up here.
          </p>
        </div>
      )}
    </section>
  );
}
