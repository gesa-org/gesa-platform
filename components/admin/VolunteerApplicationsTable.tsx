"use client";

import { useState } from "react";
import VolunteerApplicationStatusControl from "@/components/admin/VolunteerApplicationStatusControl";
import DeleteRowButton from "@/components/admin/DeleteRowButton";
import type { getAllTherapistApplications, LinkedTherapistProfile } from "@/lib/queries";
import type { TherapistApplicationStatus } from "@/lib/database.types";

// Phase 64 — maps the raw meeting-duration DB value to a human label for
// the three fixed presets, same mapping the notification email route uses.
const MEETING_DURATION_LABELS: Record<string, string> = {
  "60": "60 min",
  "45": "45 min",
  "30": "30 min",
};

type Application = Awaited<ReturnType<typeof getAllTherapistApplications>>[number];

// Phase 150 — split out of app/admin/volunteer-applications/page.tsx (a
// Server Component) so the new Delete action can manage local list state;
// layout unchanged from before this phase.
//
// Phase 186 — added `linkedProfiles` (one lookup query from the parent
// Server Component, not one per row) so each row's status control can show
// whether an Approved application already has a resulting professional
// profile, and link to it. `profileByApplicationId` is local UI state (not
// re-fetched) so it updates immediately the moment an admin creates a
// profile from this page, without a full reload.
export default function VolunteerApplicationsTable({
  initialApplications,
  linkedProfiles,
}: {
  initialApplications: Application[];
  linkedProfiles: LinkedTherapistProfile[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [profileByApplicationId, setProfileByApplicationId] = useState<Record<string, LinkedTherapistProfile>>(
    () => Object.fromEntries(linkedProfiles.map((p) => [p.volunteer_application_id, p]))
  );

  function onDeleted(id: string) {
    setApplications((rows) => rows.filter((a) => a.id !== id));
  }

  function onStatusChange(id: string, next: TherapistApplicationStatus) {
    setApplications((rows) => rows.map((a) => (a.id === id ? { ...a, status: next } : a)));
  }

  function onProfileCreated(applicationId: string, therapistId: string) {
    setProfileByApplicationId((prev) => ({
      ...prev,
      [applicationId]: { id: therapistId, full_name: "", profile_status: "draft", volunteer_application_id: applicationId },
    }));
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Volunteer professional applications ({applications.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Approving an application never lists someone as a professional by itself — that only happens when you
          choose &quot;Approve and create professional profile,&quot; or use &quot;Create Professional Profile&quot;
          afterward, and even then the new profile starts as a draft until you explicitly publish it.
        </p>
      </div>
      {applications.length === 0 ? (
        <p className="p-6 text-muted-fg">No applications found.</p>
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
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr id={a.id} key={a.id} className="scroll-mt-24 border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {/* Phase 185 — fixed locale/timeZone; see
                        BookingRequestsTable.tsx's Phase 185 comment. */}
                    {new Date(a.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
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
                      {/* Phase 185 — `?? []` guard, same reasoning as
                          TherapistCard.tsx's Phase 185 comment. */}
                      {(a.specialties ?? []).map((s) => (
                        <span key={s} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-primary">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[180px] px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(a.languages ?? []).map((l) => (
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
                    <VolunteerApplicationStatusControl
                      id={a.id}
                      fullName={a.full_name}
                      email={a.email}
                      status={a.status}
                      linkedProfile={profileByApplicationId[a.id] ?? null}
                      onStatusChange={(next) => onStatusChange(a.id, next)}
                      onProfileCreated={(therapistId) => onProfileCreated(a.id, therapistId)}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <DeleteRowButton
                      endpoint="/api/admin/volunteer-applications/delete"
                      id={a.id}
                      confirmTitle={`Delete volunteer application from ${a.full_name}?`}
                      confirmDescription="This will permanently remove this volunteer application record."
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
