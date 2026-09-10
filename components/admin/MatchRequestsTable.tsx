"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import MatchRequestStatusSelect from "@/components/admin/MatchRequestStatusSelect";
import DeleteRowButton from "@/components/admin/DeleteRowButton";
import type { getAllMatchRequests, getAllSessionBookings } from "@/lib/queries";

const FORMAT_LABEL: Record<string, string> = {
  online: "Online",
  call: "Call",
  in_person: "In-Person",
};

type MatchRequest = Awaited<ReturnType<typeof getAllMatchRequests>>[number];
type SessionBooking = Awaited<ReturnType<typeof getAllSessionBookings>>[number];

// Phase 69 — see this logic's original comment in the prior page.tsx
// version for the full rationale; unchanged by this phase's refactor.
type ConflictInfo = { type: "booked" } | { type: "requested"; count: number };

function findConflict(
  request: { id: string; selected_therapist_id: string | null; preferred_date: string | null; preferred_time: string | null },
  allRequests: { id: string; selected_therapist_id: string | null; preferred_date: string | null; preferred_time: string | null }[],
  sessionBookings: { therapist_id: string; session_date: string; session_time: string }[]
): ConflictInfo | null {
  if (!request.selected_therapist_id || !request.preferred_date || !request.preferred_time) return null;
  const prefTime = request.preferred_time.slice(0, 5);

  const alreadyBooked = sessionBookings.some(
    (s) =>
      s.therapist_id === request.selected_therapist_id &&
      s.session_date === request.preferred_date &&
      s.session_time.slice(0, 5) === prefTime
  );
  if (alreadyBooked) return { type: "booked" };

  const otherRequestsSameSlot = allRequests.filter(
    (other) =>
      other.id !== request.id &&
      other.selected_therapist_id === request.selected_therapist_id &&
      other.preferred_date === request.preferred_date &&
      other.preferred_time?.slice(0, 5) === prefTime
  );
  if (otherRequestsSameSlot.length > 0) return { type: "requested", count: otherRequestsSameSlot.length };

  return null;
}

// Phase 150 — split out of app/admin/match-requests/page.tsx (a Server
// Component) so the new Delete action can manage local list state. This
// page itself was unlinked from the admin sidebar this phase (superseded
// by support_requests/"Find Support requests") but is kept reachable by
// direct URL for historical/audit access, per the no-delete-data
// convention — see app/admin/layout.tsx's NAV comment.
export default function MatchRequestsTable({
  initialRequests,
  sessionBookings,
}: {
  initialRequests: MatchRequest[];
  sessionBookings: SessionBooking[];
}) {
  const [requests, setRequests] = useState(initialRequests);

  function onDeleted(id: string) {
    setRequests((rows) => rows.filter((r) => r.id !== id));
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Find Your Therapist requests (legacy) ({requests.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Historical rows from the retired 6-step wizard, kept for reference only — new Find Support activity lands
          in &quot;Find Support requests&quot; instead.
        </p>
      </div>
      {requests.length === 0 ? (
        <p className="p-6 text-muted-fg">No requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Requested</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Matched professional</th>
                <th className="px-5 py-3">Preferred time</th>
                <th className="px-5 py-3">Shared / preferences</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const conflict = findConflict(r, requests, sessionBookings);
                return (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                      {/* Phase 185 — fixed locale/timeZone; see
                          BookingRequestsTable.tsx's Phase 185 comment. */}
                      {new Date(r.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{r.name}</div>
                      <a href={`mailto:${r.email}`} className="text-[12.5px] text-primary underline">
                        {r.email}
                      </a>
                      {r.phone && <div className="text-[12.5px] text-muted-fg">{r.phone}</div>}
                    </td>
                    <td className="px-5 py-3">
                      {FORMAT_LABEL[r.session_format] ?? r.session_format}
                      {r.session_format === "in_person" && r.clinic_location && (
                        <div className="mt-0.5 text-[12px] text-muted-fg">{r.clinic_location.name}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {r.selected_therapist ? (
                        <div>
                          <div className="font-medium">{r.selected_therapist.full_name}</div>
                          {r.selected_therapist.contact_email && (
                            <div className="text-[12px] text-muted-fg">{r.selected_therapist.contact_email}</div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-fg">
                      {r.preferred_date || r.preferred_time ? `${r.preferred_date ?? ""} ${r.preferred_time ?? ""}` : "—"}
                      {conflict && (
                        <div
                          className={`mt-1 flex items-center gap-1 text-[11.5px] font-semibold ${
                            conflict.type === "booked" ? "text-destructive" : "text-clay"
                          }`}
                        >
                          <AlertTriangle size={12} />
                          {conflict.type === "booked"
                            ? "This professional is already booked at this time"
                            : `Also requested by ${conflict.count} other${conflict.count === 1 ? "" : "s"} for this same slot`}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[260px] px-5 py-3 text-muted-fg">
                      {r.treatment_type && <div className="mb-1">Treatment: {r.treatment_type}</div>}
                      {r.symptoms.length > 0 && <div>{r.symptoms.join(", ")}</div>}
                      {r.gender_preference !== "no_preference" && (
                        <div className="mt-1 text-[12px]">Gender pref: {r.gender_preference}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <MatchRequestStatusSelect id={r.id} status={r.status} />
                    </td>
                    <td className="px-5 py-3">
                      <DeleteRowButton
                        endpoint="/api/admin/match-requests/delete"
                        id={r.id}
                        confirmTitle={`Delete legacy match request from ${r.name}?`}
                        confirmDescription="This will permanently remove this historical Find Your Therapist (legacy) record."
                        onDeleted={onDeleted}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
