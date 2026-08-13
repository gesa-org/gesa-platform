import { createClient } from "@/lib/supabase/server";

export interface ThreadSummary {
  id: string;
  otherName: string;
  otherPhoto: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

// Returns the signed-in user's chat threads (as client or therapist), with
// the other participant's display name/photo resolved. RLS already scopes
// the underlying rows to threads the caller is part of (or admin).
export async function getMyThreads(): Promise<ThreadSummary[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select(
      "id, created_at, client_id, therapist_id, clients(full_name, profile_id), therapists(full_name, photo_url, profile_id)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!threads) return [];

  const threadIds = threads.map((t) => t.id);
  const lastMessages = new Map<string, { body: string; created_at: string }>();
  if (threadIds.length) {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("thread_id, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });
    messages?.forEach((m) => {
      if (!lastMessages.has(m.thread_id)) lastMessages.set(m.thread_id, m);
    });
  }

  return threads.map((t) => {
    const isTherapistSide = t.therapists?.profile_id === userData.user!.id;
    const other = isTherapistSide
      ? { name: t.clients?.full_name ?? "Client", photo: null as string | null }
      : { name: t.therapists?.full_name ?? "Therapist", photo: t.therapists?.photo_url ?? null };
    const last = lastMessages.get(t.id);
    return {
      id: t.id,
      otherName: other.name,
      otherPhoto: other.photo,
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.created_at ?? null,
    };
  });
}

export interface ThreadDetail {
  id: string;
  otherName: string;
}

export async function getThreadWithMessages(threadId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: thread, error } = await supabase
    .from("chat_threads")
    .select(
      "id, client_id, therapist_id, clients(full_name, profile_id), therapists(full_name, photo_url, profile_id)"
    )
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw error;
  if (!thread) return null;

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, thread_id, sender_id, body, created_at, read_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const isTherapistSide = thread.therapists?.profile_id === userData.user?.id;
  const otherName = isTherapistSide
    ? thread.clients?.full_name ?? "Client"
    : thread.therapists?.full_name ?? "Therapist";

  const detail: ThreadDetail = { id: thread.id, otherName };

  return { thread: detail, messages: messages ?? [] };
}
