import { getAllGroupRegistrations } from "@/lib/queries";
import GroupRegistrationsTable from "@/components/admin/GroupRegistrationsTable";

export const dynamic = "force-dynamic";

// Phase 150 — table markup moved into GroupRegistrationsTable.tsx (a
// Client Component) so the new Delete action can manage local list state.
export default async function AdminRegistrationsPage() {
  const registrations = await getAllGroupRegistrations();
  return <GroupRegistrationsTable initialRegistrations={registrations} />;
}
