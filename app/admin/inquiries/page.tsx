import { getAllInquiries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await getAllInquiries();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Contact inquiries ({inquiries.length})</h2>
      </div>
      {inquiries.length === 0 ? (
        <p className="p-6 text-muted-fg">No inquiries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(i.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium">{i.name || "—"}</td>
                  <td className="px-5 py-3">
                    {i.email ? (
                      <a href={`mailto:${i.email}`} className="text-primary underline">
                        {i.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-primary">
                      {i.type || "general"}
                    </span>
                  </td>
                  <td className="max-w-[360px] px-5 py-3 text-muted-fg">{i.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
