import { getAllMatchRequests } from "@/lib/queries";
import MatchRequestStatusSelect from "@/components/admin/MatchRequestStatusSelect";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  online: "Online",
  call: "Call",
  in_person: "In-Person",
};

export default async function AdminMatchRequestsPage() {
  const requests = await getAllMatchRequests();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Find Your Therapist requests ({requests.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">AI-matched session requests from the 4-step wizard.</p>
      </div>
      {requests.length === 0 ? (
        <p className="p-6 text-muted-fg">No requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Requested</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Matched therapist</th>
                <th className="px-5 py-3">Preferred time</th>
                <th className="px-5 py-3">Shared / preferences</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium">{r.name}</div>
                    <a href={`mailto:${r.email}`} className="text-[12.5px] text-primary underline">
                      {r.email}
                    </a>
                    {r.phone && <div className="text-[12.5px] text-muted-fg">{r.phone}</div>}
                  </td>
                  <td className="px-5 py-3">
                    {FORMAT_LABEL[r.session_format] ?? r.session_format}
                    {r.session_format === "in_person" && r.clinic_location && (
                      <div className="mt-0.5 text-[12px] text-muted-fg">{r.clinic_location.name}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {r.selected_therapist ? (
                      <div>
                        <div className="font-medium">{r.selected_therapist.full_name}</div>
                        {r.selected_therapist.contact_email && (
                          <div className="text-[12px] text-muted-fg">{r.selected_therapist.contact_email}</div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-fg">
                    {r.preferred_date || r.preferred_time ? `${r.preferred_date ?? ""} ${r.preferred_time ?? ""}` : "—"}
                  </td>
                  <td className="max-w-[260px] px-5 py-3 text-muted-fg">
                    {r.treatment_type && <div className="mb-1">Treatment: {r.treatment_type}</div>}
                    {r.symptoms.length > 0 && <div>{r.symptoms.join(", ")}</div>}
                    {r.gender_preference !== "no_preference" && (
                      <div className="mt-1 text-[12px]">Gender pref: {r.gender_preference}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <MatchRequestStatusSelect id={r.id} status={r.status} />
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
