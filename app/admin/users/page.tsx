import { getAllProfiles } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import RoleSelect from "@/components/admin/RoleSelect";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const profiles = await getAllProfiles();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Registered users ({profiles.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Change a user&apos;s role to grant or remove access. Restricted to administrators.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 font-medium">
                  {p.full_name || "—"} {p.id === me.id && <span className="text-[12px] text-muted-fg">(you)</span>}
                </td>
                <td className="px-5 py-3 text-muted-fg">{p.email || "—"}</td>
                <td className="px-5 py-3">
                  <RoleSelect profileId={p.id} role={p.role} isSelf={p.id === me.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
