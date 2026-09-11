import { getAllTherapistsAdmin, getAllTherapistsOnboarding, getInvitationsForTherapists } from "@/lib/queries";
import TherapistsTable from "@/components/admin/TherapistsTable";
import AddTherapistModal from "@/components/admin/AddTherapistModal";
import BulkInviteTherapistsModal from "@/components/admin/BulkInviteTherapistsModal";

export const dynamic = "force-dynamic";

// Phase 65 — Roy said toggling therapists active/deactivated one at a time
// through "Edit" (still available, unchanged — see [id]/page.tsx +
// TherapistEditForm.tsx) was tiring once there are a lot of them, and asked
// for a shortcut to select several/all and change status in one action.
// This stays a Server Component fetching the real data; the actual
// checkbox/bulk-action interactivity lives in the new client
// TherapistsTable so app/admin/therapists never needs "use client" itself.
//
// Phase 187 — added the account-onboarding side of this page: each row's
// contact_email + invitation history (for TherapistInviteActions), and the
// "Invite professionals" bulk modal next to "Add Professional." All three
// queries below run in parallel and are merged by id in the map() at the
// bottom rather than each becoming its own request-waterfall.
export default async function AdminTherapistsPage() {
  const [therapists, onboarding, invitations] = await Promise.all([
    getAllTherapistsAdmin(),
    getAllTherapistsOnboarding(),
    getInvitationsForTherapists(),
  ]);

  const contactEmailById = new Map(onboarding.map((t) => [t.id, t.contact_email]));
  const invitationsByTherapist = new Map<string, typeof invitations>();
  for (const inv of invitations) {
    if (!inv.therapist_profile_id) continue;
    const list = invitationsByTherapist.get(inv.therapist_profile_id) ?? [];
    list.push(inv);
    invitationsByTherapist.set(inv.therapist_profile_id, list);
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          {/* Phase 125 — "Therapists" -> "Our Professionals" (heading + body
              copy), matching the sidebar rename in app/admin/layout.tsx.
              Route, component names, and the underlying `therapists` table
              are unchanged. */}
          <h2 className="text-lg">Our Professionals ({therapists.length})</h2>
          <p className="mt-1 text-[13px] text-muted-fg">
            Edit photos, bios, and languages, or deactivate a professional to remove them from the public directory.
            Check several (or all) below to activate or deactivate them together. Account invitations are separate
            from public visibility — inviting someone never publishes or unpublishes their profile.
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <BulkInviteTherapistsModal candidates={onboarding} />
          <AddTherapistModal />
        </div>
      </div>
      <TherapistsTable
        therapists={therapists.map((t) => ({
          id: t.id,
          photo_url: t.photo_url,
          full_name: t.full_name,
          languages: t.languages,
          is_active: t.is_active,
          diary_link: t.diary_link,
          diary_link_status: t.diary_link_status,
          // Phase 186
          profile_status: t.profile_status,
          volunteer_application_id: t.volunteer_application_id,
          has_linked_account: Boolean(t.profile_id),
          // Phase 187
          contact_email: contactEmailById.get(t.id) ?? null,
          invitationHistory: invitationsByTherapist.get(t.id) ?? [],
        }))}
      />
    </div>
  );
}
