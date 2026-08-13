"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MessageTherapistButton({ therapistId }: { therapistId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      onClick={async () => {
        setPending(true);
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.push(`/login?next=/therapists`);
          return;
        }
        const { data: threadId, error } = await supabase.rpc("get_or_create_thread", {
          p_therapist_id: therapistId,
        });
        setPending(false);
        if (error || !threadId) {
          console.error(error);
          return;
        }
        router.push(`/messages/${threadId}`);
      }}
      disabled={pending}
      className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary disabled:opacity-60"
    >
      <MessageCircle size={14} /> {pending ? "Opening…" : "Message"}
    </button>
  );
}
