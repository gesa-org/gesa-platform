"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 bg-secondary text-foreground hover:bg-muted px-5 py-3 rounded-full text-[15px] font-semibold transition-colors"
      >
        <User size={16} /> Account <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-56 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          <div className="truncate border-b border-border px-4 py-3 text-[12.5px] text-muted-fg" title={email}>
            {email}
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[14px] transition-colors hover:bg-secondary"
          >
            My account
          </Link>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              setEmail(null);
              setOpen(false);
              window.location.href = "/";
            }}
            className="block w-full px-4 py-2.5 text-left text-[14px] text-destructive transition-colors hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
