import { getAllTherapistApplications } from "@/lib/queries";
import VolunteerApplicationsTable from "@/components/admin/VolunteerApplicationsTable";

export const dynamic = "force-dynamic";

// Phase 63 — the admin side of the new volunteer therapist application
// flow (components/volunteer/VolunteerApplicationModal.tsx). Without this
// page the data would be entirely write-only: therapist_applications' RLS
// only grants admin/reviewer read, so there was no way to actually see
// what anyone submitted.
//
// Phase 150 — table markup moved into VolunteerApplicationsTable.tsx (a
// Client Component) so the new Delete action can manage local list state.
export default async function AdminVolunteerApplicationsPage() {
  const applications = await getAllTherapistApplications();
  return <VolunteerApplicationsTable initialApplications={applications} />;
}
