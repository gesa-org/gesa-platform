import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getAllAdministrators, getAdministratorInvitations } from "@/lib/queries";
import AdministratorsTable from "@/components/admin/AdministratorsTable";
import InviteAdministratorModal from "@/components/admin/InviteAdministratorModal";

export const dynamic = "force-dynamic";

// Phase 187 — CRM > Administrators: invite/list/resend/revoke/deactivate
// for the Administrator and Super Admin roles, kept separate from the
// existing /admin/users page (which still handles Client/Reviewer/Finance
// direct-create — see RoleSelect.tsx and AddUserModal.tsx's own Phase 187
// comments for why those two paths split).
export default async function AdminAdministratorsPage() {
  const me = await requireAdmin();
  const [administrators, invitations] = await Promise.all([getAllAdministrators(), getAdministratorInvitations()]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg">Administrators</h2>
          <p className="mt-1 text-[13px] text-muted-fg">
            Administrator and Super Admin accounts are invitation-only — nobody gains CRM access without accepting a
            signed, single-use invitation and setting their own password.
          </p>
        </div>
        <InviteAdministratorModal canInviteSuperAdmin={me.role === "super_admin"} />
      </div>
      <AdministratorsTable administrators={administrators} invitations={invitations} currentUserId={me.id} />
    </div>
  );
}
