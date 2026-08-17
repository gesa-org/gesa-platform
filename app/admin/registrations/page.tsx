import { getAllGroupRegistrations } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const registrations = await getAllGroupRegistrations();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Group registrations ({registrations.length})</h2>
      </div>
      {registrations.length === 0 ? (
        <p className="p-6 text-muted-fg">No group registrations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Registered</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium">{r.name}</td>
                  <td className="px-5 py-3">
                    <a href={`mailto:${r.email}`} className="text-primary underline">
                      {r.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-muted-fg">{r.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
