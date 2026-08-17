import { getAllBookingRequests } from "@/lib/queries";
import BookingStatusSelect from "@/components/admin/BookingStatusSelect";

export const dynamic = "force-dynamic";

const ENTRY_ROUTE_LABELS: Record<string, string> = {
  crisis: "In crisis right now",
  veteran_reservist_family: "Veterans, reservists & families",
  seeking_help: "Seeking support",
  helpers: "Helping the helpers",
};

export default async function AdminBookingsPage() {
  const bookings = await getAllBookingRequests();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Booking requests ({bookings.length})</h2>
      </div>
      {bookings.length === 0 ? (
        <p className="p-6 text-muted-fg">No booking requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Requested</th>
                <th className="px-5 py-3">Entry route</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Matched therapist</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">{ENTRY_ROUTE_LABELS[b.entry_route] ?? b.entry_route}</td>
                  <td className="px-5 py-3 font-medium">{b.name}</td>
                  <td className="px-5 py-3">
                    <a href={`mailto:${b.email}`} className="text-primary underline">
                      {b.email}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    {b.matched_therapist ? (
                      <div>
                        <div className="font-medium">{b.matched_therapist.full_name}</div>
                        {b.matched_therapist.contact_email && (
                          <div className="text-[12.5px] text-muted-fg">{b.matched_therapist.contact_email}</div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <BookingStatusSelect id={b.id} status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
