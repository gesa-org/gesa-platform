import { getAllDonations } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Phase 98 — admin list view for the /donate page's gift captures, same
// table/page pattern as app/admin/inquiries/page.tsx.
//
// Phase 99 — now that donations run through real Mollie payments, each row
// carries a real payment `status` (open/pending/authorized/paid/failed/
// canceled/expired — see the DonationRow comment in lib/database.types.ts).
// The pledged-totals summary now only counts rows that actually cleared
// ("paid"), since an "open" or "failed" row never became real money.
const STATUS_LABELS: Record<string, string> = {
  open: "Awaiting checkout",
  pending: "Processing",
  authorized: "Authorized",
  paid: "Paid",
  failed: "Failed",
  canceled: "Canceled",
  expired: "Expired",
};

const STATUS_CLASSES: Record<string, string> = {
  paid: "bg-accent-soft text-primary",
  pending: "bg-clay-soft text-primary",
  authorized: "bg-clay-soft text-primary",
  open: "bg-secondary text-muted-fg",
  failed: "bg-destructive/10 text-destructive",
  canceled: "bg-destructive/10 text-destructive",
  expired: "bg-destructive/10 text-destructive",
};

export default async function AdminDonationsPage() {
  const donations = await getAllDonations();
  const paid = donations.filter((d) => d.status === "paid");
  const totalOnce = paid.filter((d) => d.frequency === "once").reduce((sum, d) => sum + Number(d.amount), 0);
  const totalMonthly = paid.filter((d) => d.frequency === "monthly").reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <h2 className="text-lg">Donations ({donations.length})</h2>
        <div className="flex flex-wrap gap-4 text-[13px] text-muted-fg">
          <span>
            One-time paid: <strong className="text-foreground">€{totalOnce.toLocaleString()}</strong>
          </span>
          <span>
            Monthly paid: <strong className="text-foreground">€{totalMonthly.toLocaleString()}</strong>/mo
          </span>
        </div>
      </div>
      {donations.length === 0 ? (
        <p className="p-6 text-muted-fg">No donations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Frequency</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium">{d.full_name || "—"}</td>
                  <td className="px-5 py-3">
                    {d.email ? (
                      <a href={`mailto:${d.email}`} className="text-primary underline">
                        {d.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-fg">{d.phone || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-primary">
                      {d.frequency === "monthly" ? "Monthly" : "One-time"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium">
                    €{Number(d.amount).toLocaleString()}
                    {d.frequency === "monthly" ? "/mo" : ""}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS_CLASSES[d.status] ?? "bg-secondary text-muted-fg"}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="max-w-[240px] px-5 py-3 text-muted-fg">{d.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
