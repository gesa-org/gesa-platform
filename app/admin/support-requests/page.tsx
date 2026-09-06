import { getAllSupportRequests } from "@/lib/queries";
import SupportRequestStatusSelect from "@/components/admin/SupportRequestStatusSelect";
import { Sparkle, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const FORMAT_LABEL: Record<string, string> = {
  online: "Online",
  call: "Call",
  in_person: "In-Person",
};

// Phase 142 — the unified CRM view for the "Find Support" flow, over the
// new support_requests table (both AI Support and Manual Support rows —
// see /api/support-pathway). Replaces app/admin/match-requests/page.tsx as
// the primary view for new requests going forward; that page is left in
// place (unchanged) so historical match_requests rows from before this
// phase stay visible.
export default async function AdminSupportRequestsPage() {
  const requests = await getAllSupportRequests();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Find Support requests ({requests.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Every client who went through the Find Support choice screen — AI Support and Manual Support both.
        </p>
      </div>
      {requests.length === 0 ? (
        <p className="p-6 text-muted-fg">No requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Requested</th>
                <th className="px-5 py-3">Pathway</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Selected professional</th>
                <th className="px-5 py-3">Preferences</th>
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
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                        r.pathway === "ai" ? "bg-accent-soft text-primary" : "bg-secondary text-muted-fg"
                      }`}
                    >
                      {r.pathway === "ai" ? <Sparkle size={11} /> : <Users size={11} />}
                      {r.pathway === "ai" ? "AI Support" : "Manual"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {r.full_name || r.email ? (
                      <>
                        <div className="font-medium">{r.full_name || "—"}</div>
                        {r.email && (
                          <a href={`mailto:${r.email}`} className="text-[12.5px] text-primary underline">
                            {r.email}
                          </a>
                        )}
                        {r.phone && <div className="text-[12.5px] text-muted-fg">{r.phone}</div>}
                      </>
                    ) : (
                      <span className="text-muted-fg">Not yet provided</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {r.session_format ? FORMAT_LABEL[r.session_format] ?? r.session_format : "—"}
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
                  <td className="max-w-[280px] px-5 py-3 text-muted-fg">
                    {r.treatment_type && <div className="mb-1">Treatment: {r.treatment_type}</div>}
                    {r.support_categories.length > 0 && <div>{r.support_categories.join(", ")}</div>}
                    {r.gender_preference !== "no_preference" && (
                      <div className="mt-1 text-[12px]">Gender pref: {r.gender_preference}</div>
                    )}
                    {r.preferred_language && <div className="mt-1 text-[12px]">Language: {r.preferred_language}</div>}
                    {r.feelings_text && (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-[12px] font-semibold text-primary">
                          How they&apos;re feeling
                        </summary>
                        <p className="mt-1 whitespace-pre-line text-[12.5px]">{r.feelings_text}</p>
                      </details>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <SupportRequestStatusSelect id={r.id} status={r.status} />
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
