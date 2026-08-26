import { getAllTherapistsAdmin } from "@/lib/queries";
import TherapistsTable from "@/components/admin/TherapistsTable";

export const dynamic = "force-dynamic";

// Phase 65 — Roy said toggling therapists active/deactivated one at a time
// through "Edit" (still available, unchanged — see [id]/page.tsx +
// TherapistEditForm.tsx) was tiring once there are a lot of them, and asked
// for a shortcut to select several/all and change status in one action.
// This stays a Server Component fetching the real data; the actual
// checkbox/bulk-action interactivity lives in the new client
// TherapistsTable so app/admin/therapists never needs "use client" itself.
export default async function AdminTherapistsPage() {
  const therapists = await getAllTherapistsAdmin();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Therapists ({therapists.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Edit photos, bios, and languages, or deactivate a therapist to remove them from the public directory. Check
          several (or all) below to activate or deactivate them together.
        </p>
      </div>
      <TherapistsTable
        therapists={therapists.map((t) => ({
          id: t.id,
          photo_url: t.photo_url,
          full_name: t.full_name,
          languages: t.languages,
          is_active: t.is_active,
        }))}
      />
    </div>
  );
}
