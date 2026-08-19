import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Phase 20 — real, conflict-free scheduling. Given a therapist and a date,
// this returns every bookable time slot for that day of week (from
// therapist_weekly_hours) minus any slot already reserved in
// session_bookings (via the get_booked_slots() RPC, which exposes only the
// time — never the other client's name/email). This is the single source of
// truth the booking UI reads from, so a client can never even be shown a
// slot that's already taken.
//
// The final guarantee against double-booking isn't this endpoint, though —
// it's the UNIQUE(therapist_id, session_date, session_time) constraint on
// session_bookings itself, which closes the race-condition window between
// "we told you this slot was free" and "you actually submitted the booking."
const SLOT_MINUTES = 60;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const therapistId = searchParams.get("therapistId");
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!therapistId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "therapistId and a valid date are required" }, { status: 400 });
  }

  // Never offer a slot in the past.
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return NextResponse.json({ slots: [] });
  }

  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const supabase = await createClient();

  const [{ data: hours, error: hoursError }, { data: booked, error: bookedError }] = await Promise.all([
    supabase
      .from("therapist_weekly_hours")
      .select("start_time, end_time")
      .eq("therapist_id", therapistId)
      .eq("day_of_week", dayOfWeek),
    supabase.rpc("get_booked_slots", { p_therapist_id: therapistId, p_date: date }),
  ]);

  if (hoursError || bookedError) {
    return NextResponse.json({ error: "could not load availability" }, { status: 500 });
  }

  const bookedTimes = new Set((booked ?? []).map((b) => b.session_time.slice(0, 5)));

  const slots: string[] = [];
  for (const window of hours ?? []) {
    let cursor = timeToMinutes(window.start_time);
    const end = timeToMinutes(window.end_time);
    while (cursor + SLOT_MINUTES <= end) {
      const time = minutesToTime(cursor);
      if (!bookedTimes.has(time)) slots.push(time);
      cursor += SLOT_MINUTES;
    }
  }

  slots.sort();
  return NextResponse.json({ slots });
}
