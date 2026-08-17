import Link from "next/link";
import { getAllChatThreads } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const threads = await getAllChatThreads();

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-lg">Client ↔ Therapist messages ({threads.length})</h2>
        <p className="mt-1 text-[13px] text-muted-fg">
          For evaluation and monitoring only — conversations remain private between the client and therapist.
        </p>
      </div>
      {threads.length === 0 ? (
        <p className="p-6 text-muted-fg">No conversations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Therapist</th>
                <th className="px-5 py-3">Last message</th>
                <th className="px-5 py-3">Messages</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-5 py-3 text-muted-fg">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium">{t.clientName}</td>
                  <td className="px-5 py-3 font-medium">{t.therapistName}</td>
                  <td className="max-w-[280px] truncate px-5 py-3 text-muted-fg">{t.lastMessage ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/messages/${t.id}`} className="font-semibold text-primary underline">
                      View {t.messageCount} message{t.messageCount === 1 ? "" : "s"}
                    </Link>
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
