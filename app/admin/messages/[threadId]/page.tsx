import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChatThreadForAdmin } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminThreadPage({ params }: { params: { threadId: string } }) {
  const result = await getChatThreadForAdmin(params.threadId);
  if (!result) notFound();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <Link href="/admin/messages" className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
          <ArrowLeft size={14} /> All conversations
        </Link>
        <h2 className="text-lg">
          {result.clientName} ↔ {result.therapistName}
        </h2>
        <p className="mt-1 text-[13px] text-muted-fg">Read-only — for evaluation and monitoring.</p>
      </div>
      <div className="max-h-[560px] space-y-3 overflow-y-auto p-5">
        {result.messages.length === 0 ? (
          <p className="text-muted-fg">No messages yet.</p>
        ) : (
          result.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] ${
                m.senderLabel === "Client" ? "bg-secondary" : "ml-auto bg-accent-soft"
              }`}
            >
              <div className="mb-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-fg">
                {m.senderLabel} · {new Date(m.created_at).toLocaleString()}
              </div>
              {m.body}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
