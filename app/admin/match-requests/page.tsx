import { getAllMatchRequests, getAllSessionBookings } from "@/lib/queries";
import MatchRequestStatusSelect from "@/components/admin/MatchRequestStatusSelect";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  online: "Online",
  call: "Call",
  in_person: "In-Person",
};

// Phase 69 — Roy asked to "avoid double booking with a same time or
// person with one therapist only." Real reservations (session_bookings)
// already can't collide — see the get_booked_slots RPC + unique DB
// constraint in app/api/intake-booking/route.ts — but a "Find Your
// Therapist" request's preferred_date/preferred_time is just that, a
// preference, with nothing stopping an admin from confirming two people
// into the very slot a therapist is already booked for, or two different
// requests both eyeing the same open slot without either side knowing.
// This flags both cases directly in the admin list, at the point where a
// human decides whether to actually schedule it, rather than inventing a
// second real-time reservation system for a "preferred time" field that
// was never meant to be a hard booking.
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

export default async function AdminMatchRequestsPage() {
  const [requests, sessionBookings] = await Promise.all([getAllMatchRequests(), getAllSessionBookings()]);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Find Your Therapist requests ({requests.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">AI-matched session requests from the 4-step wizard.</p>
      </div>
      {requests.length === 0 ? (
        <p className="p-6 text-muted-fg">No requests yet.</p>
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
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const conflict = findConflict(r, requests, sessionBookings);
                return (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(r.created_at).toLocaleDateString()}
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
