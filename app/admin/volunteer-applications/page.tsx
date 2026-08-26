import { getAllTherapistApplications } from "@/lib/queries";
import VolunteerApplicationStatusSelect from "@/components/admin/VolunteerApplicationStatusSelect";

export const dynamic = "force-dynamic";

// Phase 64 — maps the raw meeting-duration DB value to a human label for
// the three fixed presets, same mapping the notification email route uses.
// Phase 65 — a volunteer's own "Specify time" free text (e.g. "2 hours")
// isn't a preset, so it isn't in this map and falls through to the
// `?? a.meeting_duration` below, showing exactly what they typed.
const MEETING_DURATION_LABELS: Record<string, string> = {
  "60": "60 min",
  "45": "45 min",
  "30": "30 min",
};

// Phase 63 — the admin side of the new volunteer therapist application
// flow (components/volunteer/VolunteerApplicationModal.tsx). Without this
// page the data would be entirely write-only: therapist_applications' RLS
// only grants admin/reviewer read, so there was no way to actually see
// what anyone submitted. Same list-page pattern as
// app/admin/bookings/page.tsx and app/admin/inquiries/page.tsx.
export default async function AdminVolunteerApplicationsPage() {
  const applications = await getAllTherapistApplications();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Volunteer therapist applications ({applications.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Approving here is just a status label for your own tracking — it doesn&apos;t automatically create a
          listed therapist. Add them to Therapists yourself once you&apos;re satisfied with an application.
        </p>
      </div>
      {applications.length === 0 ? (
        <p className="p-6 text-muted-fg">No applications yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Applied</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Specialties</th>
                <th className="px-5 py-3">Languages</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Proof of license</th>
                <th className="px-5 py-3">Bio</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium">{a.full_name}</td>
                  <td className="px-5 py-3">
                    <a href={`mailto:${a.email}`} className="text-primary underline">
                      {a.email}
                    </a>
                    {a.phone && <div className="text-[12.5px] text-muted-fg">{a.phone}</div>}
                  </td>
                  <td className="max-w-[220px] px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-primary">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[180px] px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.languages.map((l) => (
                        <span key={l} className="rounded-full border border-border bg-card px-2 py-0.5 text-[11.5px] font-medium text-muted-fg">
                          {l}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[11.5px] font-semibold text-clay">
                      {MEETING_DURATION_LABELS[a.meeting_duration] ?? a.meeting_duration}
                    </span>
                  </td>
                  <td className="max-w-[260px] whitespace-pre-line px-5 py-3 text-muted-fg">{a.credentials_proof}</td>
                  <td className="max-w-[260px] whitespace-pre-line px-5 py-3 text-muted-fg">{a.bio}</td>
                  <td className="px-5 py-3">
                    <VolunteerApplicationStatusSelect id={a.id} status={a.status} />
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
