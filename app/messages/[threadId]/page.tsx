import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getThreadWithMessages } from "@/lib/chat";
import ChatWindow from "@/components/chat/ChatWindow";

export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const result = await getThreadWithMessages(params.threadId);
  if (!result) notFound();

  return (
    <section className="section narrow">
      <ChatWindow
        threadId={params.threadId}
        initialMessages={result.messages}
        otherName={result.thread.otherName}
      />
    </section>
  );
}
