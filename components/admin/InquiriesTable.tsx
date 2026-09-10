"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Eye } from "lucide-react";
import InquiryStatusSelect from "@/components/admin/InquiryStatusSelect";
import InquiryDetailModal from "@/components/admin/InquiryDetailModal";
import DeleteRowButton from "@/components/admin/DeleteRowButton";
import type { getAllInquiries } from "@/lib/queries";

type Inquiry = Awaited<ReturnType<typeof getAllInquiries>>[number];

const STATUSES = ["New", "Seen", "In Progress", "Resolved", "Archived"] as const;

const SOURCE_LABELS: Record<string, string> = {
  contact_form: "Contact page",
  help_us_grow: "Footer",
  legacy: "Legacy",
};

// Phase 150 — the revamped single primary CRM location for general
// inquiries, per the "Inquiries Page Requirements" spec: search by name/
// email/subject/message, status filtering, date sort, a detail view, and
// the new Delete action. Both public forms that create rows here (the
// Contact page's ContactForm and the footer's HelpUsGrowForm) already fed
// this same `inquiries` table before this phase — the redundancy this
// phase actually found and fixed was in the CRM/dashboard layer (stale
// "Find Your Therapist (legacy)" data, no delete anywhere), not a second
// inquiry form to remove here.
export default function InquiriesTable({ initialInquiries }: { initialInquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  function onDeleted(id: string) {
    setInquiries((rows) => rows.filter((r) => r.id !== id));
    if (detailId === id) setDetailId(null);
  }

  function onStatusChanged(id: string, status: string) {
    setInquiries((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = inquiries;
    if (statusFilter !== "all") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (q) {
      rows = rows.filter((r) =>
        [r.name, r.email, r.type, r.message].some((field) => field?.toLowerCase().includes(q))
      );
    }
    return [...rows].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? diff : -diff;
    });
  }, [inquiries, search, statusFilter, sortAsc]);

  const detailInquiry = detailId ? inquiries.find((r) => r.id === detailId) ?? null : null;

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Inquiries ({inquiries.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          Every general inquiry submitted through the Contact page or the footer &quot;Help us grow&quot; form — the
          single, authoritative source for client inquiries.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, subject, or message…"
            className="w-full max-w-[320px] rounded-full border border-border bg-background px-4 py-2 text-[13.5px] focus:border-primary focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium focus:border-primary focus:outline-none"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-[13px] font-medium text-muted-fg hover:text-primary"
          >
            <ArrowDownUp size={13} /> {sortAsc ? "Oldest first" : "Newest first"}
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="p-6 text-muted-fg">No inquiries found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {/* Phase 185 — fixed locale/timeZone; see
                        BookingRequestsTable.tsx's Phase 185 comment. */}
                    {new Date(i.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
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
                  <td className="px-5 py-3 text-muted-fg">{i.phone || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-primary">
                      {i.type || "general"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted-fg">
                    {SOURCE_LABELS[i.source ?? ""] ?? i.source ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <InquiryStatusSelect id={i.id} status={i.status} onChanged={(next) => onStatusChanged(i.id, next)} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailId(i.id)}
                        aria-label="View inquiry"
                        className="inline-flex items-center gap-1.5 rounded-full p-1.5 text-muted-fg hover:bg-secondary hover:text-primary"
                      >
                        <Eye size={15} />
                      </button>
                      <DeleteRowButton
                        endpoint="/api/admin/inquiries/delete"
                        id={i.id}
                        confirmTitle={`Delete inquiry from ${i.name || i.email || "this client"}?`}
                        confirmDescription="This will permanently remove this inquiry record."
                        onDeleted={onDeleted}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailInquiry && (
        <InquiryDetailModal
          inquiry={detailInquiry}
          onClose={() => setDetailId(null)}
          onDeleted={onDeleted}
          onStatusChanged={onStatusChanged}
        />
      )}
    </div>
  );
}
