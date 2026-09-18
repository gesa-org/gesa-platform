import { createClient } from "@/lib/supabase/server";
import type { EmailDeliveryStatus, EmailRecipientRole } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: EmailDeliveryStatus[] = [
  "pending",
  "sent",
  "delivered",
  "failed",
  "bounced",
  "complained",
  "suppressed",
  "retrying",
];
const RECIPIENT_OPTIONS: EmailRecipientRole[] = ["client", "therapist", "admin", "system"];

function readOption<T extends string>(value: string | undefined, options: readonly T[]): T | null {
  return value && options.includes(value as T) ? (value as T) : null;
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: EmailDeliveryStatus) {
  if (status === "failed" || status === "bounced" || status === "complained" || status === "suppressed") return "bg-red-100 text-red-800";
  if (status === "delivered" || status === "sent") return "bg-emerald-100 text-emerald-800";
  return "bg-amber-100 text-amber-800";
}

export default async function EmailNotificationsPage({
  searchParams,
}: {
  searchParams: { status?: string; recipient?: string; template?: string; from?: string; to?: string };
}) {
  const status = readOption(searchParams.status, STATUS_OPTIONS);
  const recipient = readOption(searchParams.recipient, RECIPIENT_OPTIONS);
  const template = searchParams.template?.trim() || null;
  const from = searchParams.from?.trim() || null;
  const to = searchParams.to?.trim() || null;
  const supabase = await createClient();

  let query = supabase
    .from("email_delivery_log")
    .select("id, template_type, recipient_role, recipient_email, related_record_type, related_record_id, status, failure_reason, attempt_count, created_at, sent_at, delivered_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (recipient) query = query.eq("recipient_role", recipient);
  if (template) query = query.eq("template_type", template);
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
  const { data: rows, error } = await query;

  return (
    <section>
      <div className="mb-6">
        <span className="mb-2 inline-block text-[12px] font-bold uppercase tracking-[0.14em] text-primary">Operations</span>
        <h2 className="text-[26px] text-primary">Email &amp; Notifications</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
          Server-side transactional delivery history. This view is restricted to administrators; recipients never see delivery records or provider details.
        </p>
      </div>

      <form className="mb-5 grid gap-3 rounded-2xl border border-border bg-card/80 p-4 md:grid-cols-5" method="get">
        <label className="text-xs font-semibold text-primary">Status
          <select className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{label(option)}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-primary">Recipient
          <select className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm" name="recipient" defaultValue={recipient ?? ""}>
            <option value="">All recipients</option>
            {RECIPIENT_OPTIONS.map((option) => <option key={option} value={option}>{label(option)}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-primary">Template
          <input className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm" name="template" defaultValue={template ?? ""} placeholder="e.g. booking_confirmation" />
        </label>
        <label className="text-xs font-semibold text-primary">From
          <input className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm" name="from" type="date" defaultValue={from ?? ""} />
        </label>
        <label className="text-xs font-semibold text-primary">To
          <input className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm" name="to" type="date" defaultValue={to ?? ""} />
        </label>
        <div className="md:col-span-5"><button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg" type="submit">Apply filters</button></div>
      </form>

      {error ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          Email delivery records are not available yet. Apply the <code>email_delivery_log</code> migration before using this CRM view.
        </div>
      ) : rows?.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/80 p-6 text-sm text-muted-fg">No delivery records match these filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/80">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-fg">
              <tr><th className="px-4 py-3">Created</th><th className="px-4 py-3">Template</th><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Related record</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Reason</th></tr>
            </thead>
            <tbody>
              {rows?.map((row) => (
                <tr className="border-b border-border/70 last:border-0" key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-fg">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-primary">{label(row.template_type)}</td>
                  <td className="px-4 py-3"><div>{row.recipient_email}</div><div className="text-xs text-muted-fg">{label(row.recipient_role)}</div></td>
                  <td className="px-4 py-3"><div>{label(row.related_record_type)}</div><div className="font-mono text-xs text-muted-fg">{row.related_record_id}</div></td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}>{label(row.status)}</span></td>
                  <td className="px-4 py-3">{row.attempt_count}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-muted-fg">{row.failure_reason ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
