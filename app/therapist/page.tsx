import Link from "next/link";
import { CalendarCheck2, CalendarDays, CalendarClock } from "lucide-react";
import { requireTherapist } from "@/lib/auth/requireTherapist";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Phase 208 — this used to be the therapist dashboard's only page (every
// section now lives at its own route — see app/therapist/bookings/page.tsx
// and app/therapist/diary/page.tsx, reached via the new sidebar in
// app/therapist/layout.tsx). "Dashboard" is now a slim overview: today's
// real, confirmed session count plus quick links into the sections that
// hold the detail, rather than duplicating every list here too.
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
  const today = new Date().toISOString().slice(0, 10);
  const { data: todaySessions } = await supabase
    .from("session_bookings")
    .select("id")
    .eq("therapist_id", self.therapist.id)
    .eq("session_date", today)
    .eq("status", "confirmed");

  const todayCount = todaySessions?.length ?? 0;

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
          <CalendarClock size={18} className="text-primary" /> Today
        </h2>
        <p className="text-[14px] text-muted-fg">
          {todayCount === 0
            ? "No confirmed sessions scheduled for today."
            : `${todayCount} confirmed session${todayCount === 1 ? "" : "s"} scheduled for today.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/therapist/bookings"
          className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-5 transition-colors hover:bg-secondary"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-soft text-primary">
            <CalendarCheck2 size={18} />
          </span>
          <div>
            <div className="text-[15px] font-medium">My Bookings</div>
            <div className="text-[13px] text-muted-fg">Upcoming sessions, AI Support matches, and past requests</div>
          </div>
        </Link>
        <Link
          href="/therapist/diary"
          className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-5 transition-colors hover:bg-secondary"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-soft text-primary">
            <CalendarDays size={18} />
          </span>
          <div>
            <div className="text-[15px] font-medium">My Diary</div>
            <div className="text-[13px] text-muted-fg">View your external calendar without leaving GESA</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
