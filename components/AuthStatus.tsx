"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Avoid a flash of "Sign In" before the client has checked the session.
  if (email === undefined) {
    return <span className="inline-flex h-[46px] w-[92px] rounded-full bg-secondary/60" />;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 bg-secondary text-foreground hover:bg-muted px-6 py-3 rounded-full text-[15px] font-semibold transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setEmail(null);
        window.location.href = "/";
      }}
      className="inline-flex items-center gap-2 bg-secondary text-foreground hover:bg-muted px-6 py-3 rounded-full text-[15px] font-semibold transition-colors"
      title={email}
    >
      Sign out
    </button>
  );
}
