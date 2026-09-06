"use client";

import { useState } from "react";
import SessionBookingStatusSelect from "@/components/admin/SessionBookingStatusSelect";
import DeleteRowButton from "@/components/admin/DeleteRowButton";
import type { getAllSessionBookings } from "@/lib/queries";

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  zoom: "Zoom",
};

const PATH_LABELS: Record<string, string> = {
  crisis: "In crisis right now",
  veteran: "Veterans, reservists & families",
  general: "Seeking support",
  helpers: "Helping the helpers",
  directory: "Our Therapists directory",
};

type Booking = Awaited<ReturnType<typeof getAllSessionBookings>>[number];

// Phase 150 — split out of app/admin/sessions/page.tsx (a Server Component)
// purely so the Delete action can manage its own local list state; the
// table's own layout/columns/labels are unchanged from before this phase.
export default function SessionBookingsTable({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState(initialBookings);

  function onDeleted(id: string) {
    setBookings((rows) => rows.filter((r) => r.id !== id));
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Session bookings ({bookings.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Confirmed, conflict-free slots booked through the Home page&apos;s &quot;Reach out now&quot; flow.
        </p>
      </div>
      {bookings.length === 0 ? (
        <p className="p-6 text-muted-fg">No sessions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Date &amp; time</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Professional</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Path</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 font-medium">
                    {b.session_date} · {b.session_time.slice(0, 5)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium">{b.client_name}</div>
                    <a href={`mailto:${b.client_email}`} className="text-[12.5px] text-primary underline">
                      {b.client_email}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    {b.therapist ? (
                      <div>
                        <div className="font-medium">{b.therapist.full_name}</div>
                        {b.therapist.contact_email && (
                          <div className="text-[12.5px] text-muted-fg">{b.therapist.contact_email}</div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3">{CHANNEL_LABELS[b.contact_channel] ?? b.contact_channel}</td>
                  <td className="px-5 py-3">{b.path ? (PATH_LABELS[b.path] ?? b.path) : "—"}</td>
                  <td className="px-5 py-3">
                    <SessionBookingStatusSelect id={b.id} status={b.status} />
                  </td>
                  <td className="px-5 py-3">
                    <DeleteRowButton
                      endpoint="/api/admin/session-bookings/delete"
                      id={b.id}
                      confirmTitle={`Delete session booking for ${b.client_name}?`}
                      confirmDescription="This will permanently remove this session booking record."
                      onDeleted={onDeleted}
                    />
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
