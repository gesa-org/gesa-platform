import { getAllSessionBookings } from "@/lib/queries";
import SessionBookingsTable from "@/components/admin/SessionBookingsTable";

export const dynamic = "force-dynamic";

// Phase 20 — these rows are real, conflict-free reservations (a DB unique
// constraint on therapist_id + session_date + session_time guarantees no
// two rows can name the same slot), unlike the "preferred time" requests in
// the older Match Requests / Booking Requests tables.
//
// Phase 150 — the actual table markup moved into SessionBookingsTable.tsx
// (a Client Component) so its new Delete action can manage local list
// state; this page stays a Server Component that just fetches and hands
// the rows down, same split used for every other list page this phase.
export default async function AdminSessionsPage() {
  const bookings = await getAllSessionBookings();
  return <SessionBookingsTable initialBookings={bookings} />;
}
