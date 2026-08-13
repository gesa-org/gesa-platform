import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyThreads } from "@/lib/chat";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const threads = await getMyThreads();

  return (
    <section className="section narrow">
      <div className="mb-8">
        <span className="eyebrow">Messages</span>
        <h1 className="my-2.5 text-[34px]">Your conversations</h1>
      </div>

      {threads.length ? (
        <div className="flex flex-col gap-2.5">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/messages/${t.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent"
            >
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-secondary font-serif font-semibold text-primary">
                {t.otherName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{t.otherName}</div>
                <div className="truncate text-sm text-muted-fg">{t.lastMessage ?? "No messages yet"}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-10 text-center text-muted-fg">
          <MessageCircle size={28} className="text-accent" />
          <p>
            No conversations yet. Start one from a therapist&apos;s profile in{" "}
            <Link href="/therapists" className="font-semibold text-primary">
              Our Specialists
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  );
}
