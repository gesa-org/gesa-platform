"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <h1 className="mb-1 text-2xl">Sign in</h1>
        <p className="mb-6 text-sm text-muted-fg">Access your sessions, chat, and profile.</p>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            const data = new FormData(e.currentTarget);
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: String(data.get("email") ?? ""),
              password: String(data.get("password") ?? ""),
            });
            setPending(false);
            if (signInError) {
              setError(signInError.message);
              return;
            }
            // Read `next` directly from the URL rather than via useSearchParams(),
            // which would force this page out of static rendering (Next 14
            // requires a Suspense boundary around that hook).
            const next = new URLSearchParams(window.location.search).get("next");
            router.push(next || "/");
            router.refresh();
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            {/* Phase 175 — PasswordInput renders its own <label>, but this
                field also needs the "Forgot password?" link sharing the
                same row as that label, so the row is built here instead of
                passing `label` through — same visible label text and
                htmlFor/id pairing as before ("Password" / "login-password"),
                just split across two elements. */}
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="login-password" className="block text-sm font-semibold">
                Password
              </label>
              {/* Phase 78 — Roy sent a screenshot of this exact login card
                  flagging that there was no way for a user who forgot their
                  password to actually get back in — the only options were
                  "Create one" (a new account) or giving up. Links to the
                  new /forgot-password request-reset page. */}
              <Link href="/forgot-password" className="text-[13px] font-semibold text-primary">
                Forgot password?
              </Link>
            </div>
            {/* Phase 175 — added the shared show/hide toggle. `label` is
                omitted since the visible "Password" label above is already
                htmlFor="login-password" — PasswordInput skips rendering its
                own <label> whenever `label` isn't passed, so this field
                still has exactly one label, not two. No strength policy
                here on purpose (see lib/auth/passwordPolicy.ts) — this
                field is checking an existing password, not choosing a new
                one. */}
            <PasswordInput id="login-password" name="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} block>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-fg">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-fg">
          Looking for support instead?{" "}
          <Link href="/intake" className="font-semibold text-primary">
            Start here
          </Link>
        </p>
      </div>
    </section>
  );
}
