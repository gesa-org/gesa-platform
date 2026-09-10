"use client";

import { useState } from "react";
import DeleteRowButton from "@/components/admin/DeleteRowButton";
import type { getAllGroupRegistrations } from "@/lib/queries";

type Registration = Awaited<ReturnType<typeof getAllGroupRegistrations>>[number];

// Phase 150 — split out of app/admin/registrations/page.tsx (a Server
// Component) so the new Delete action can manage local list state; layout
// unchanged from before this phase.
export default function GroupRegistrationsTable({ initialRegistrations }: { initialRegistrations: Registration[] }) {
  const [registrations, setRegistrations] = useState(initialRegistrations);

  function onDeleted(id: string) {
    setRegistrations((rows) => rows.filter((r) => r.id !== id));
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Group registrations ({registrations.length})</h2>
      </div>
      {registrations.length === 0 ? (
        <p className="p-6 text-muted-fg">No group registrations found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Registered</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {/* Phase 185 — fixed locale/timeZone; see
                        BookingRequestsTable.tsx's Phase 185 comment. */}
                    {new Date(r.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
                  </td>
                  <td className="px-5 py-3 font-medium">{r.name}</td>
                  <td className="px-5 py-3">
                    <a href={`mailto:${r.email}`} className="text-primary underline">
                      {r.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-muted-fg">{r.phone || "—"}</td>
                  <td className="px-5 py-3">
                    <DeleteRowButton
                      endpoint="/api/admin/group-registrations/delete"
                      id={r.id}
                      confirmTitle={`Delete group registration from ${r.name}?`}
                      confirmDescription="This will permanently remove this group registration record."
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
