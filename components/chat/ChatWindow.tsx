"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Message = Tables<"chat_messages">;

export default function ChatWindow({
  threadId,
  initialMessages,
  otherName,
}: {
  threadId: string;
  initialMessages: Message[];
  otherName: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || !userId) return;
    setSending(true);
    setDraft("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ thread_id: threadId, sender_id: userId, body })
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    }
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-[var(--radius)] border border-border bg-card">
      <div className="border-b border-border px-5 py-4 font-semibold">{otherName}</div>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14.5px] ${
                  mine ? "bg-primary text-white" : "bg-secondary text-foreground"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        {!messages.length && (
          <p className="text-center text-sm text-muted-fg">
            No messages yet — say hello to start the conversation.
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex gap-2 border-t border-border p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
