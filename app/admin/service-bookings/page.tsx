import { getAllDiarySchedulingEvents } from "@/lib/queries";
import ServiceBookingsTable from "@/components/admin/ServiceBookingsTable";

export const dynamic = "force-dynamic";

// Phase 196 — new admin review page for the Community page's Charity
// Services / Professional Services bookings (diary_scheduling_events rows
// tagged with service_type). Deliberately a separate route from the
// existing /admin/sessions ("Session bookings" — the older session_bookings
// table, an unrelated data model, see getAllSessionBookings() in
// lib/queries.ts) rather than merged into it, so neither flow's meaning or
// existing links (the Overview dashboard's "Session bookings" KPI tile
// still points at /admin/sessions) change underneath anyone.
export default async function AdminServiceBookingsPage() {
  const events = await getAllDiarySchedulingEvents();
  return <ServiceBookingsTable initialEvents={events} />;
}
