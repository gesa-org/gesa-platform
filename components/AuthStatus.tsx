"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, ChevronDown, ShieldCheck, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTherapist, setIsTherapist] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadRole(userId: string) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
      setIsAdmin(profile?.role === "admin");
      setIsTherapist(profile?.role === "therapist");
    }

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      if (data.user) loadRole(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user) loadRole(session.user.id);
      else {
        setIsAdmin(false);
        setIsTherapist(false);
      }
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

  // Phase 214 — Roy asked for the "Sign In" entry point removed from the
  // public header entirely (account access now lives in the footer's
  // "Sign In / Create Account" link instead — see Footer.tsx). This
  // component still renders nothing while the session check is in flight
  // (email === undefined) and nothing at all once it resolves to "no
  // session" — no loading skeleton is needed for a slot that never renders
  // anything visible either way. The signed-in "Account" menu below is
  // completely untouched: /login, /signup, and every Supabase Auth call
  // this component makes are unchanged, so a visitor who reaches /login or
  // /account-access directly (via the footer link, a bookmark, or a
  // deep link) still signs in exactly as before — only this header
  // placement of the entry point is gone.
  if (email === undefined || !email) {
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      {/* Phase 199 (mobile pass) — "Account" text now hides below `sm`
          (button becomes icon+chevron only, ~44px min touch target still
          intact via padding) so this doesn't push the header's right-side
          cluster into overflow on 320-375px phones, same pattern already
          used by LanguageSelector's language name. */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex items-center gap-1.5 bg-secondary text-foreground hover:bg-muted px-3.5 py-3 sm:px-5 rounded-full text-[15px] font-semibold transition-colors"
      >
        <User size={16} /> <span className="hidden sm:inline">Account</span> <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
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
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 border-t border-border px-4 py-2.5 text-[14px] font-medium text-primary transition-colors hover:bg-secondary"
            >
              <ShieldCheck size={15} /> CRM Dashboard
            </Link>
          )}
          {isTherapist && (
            <Link
              href="/therapist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 border-t border-border px-4 py-2.5 text-[14px] font-medium text-primary transition-colors hover:bg-secondary"
            >
              <CalendarClock size={15} /> My Dashboard
            </Link>
          )}
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
