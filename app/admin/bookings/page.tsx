import { getAllBookingRequests } from "@/lib/queries";
import BookingRequestsTable from "@/components/admin/BookingRequestsTable";

export const dynamic = "force-dynamic";

// Phase 150 — table markup moved into BookingRequestsTable.tsx (a Client
// Component) so the new Delete action can manage local list state.
export default async function AdminBookingsPage() {
  const bookings = await getAllBookingRequests();
  return <BookingRequestsTable initialBookings={bookings} />;
}
