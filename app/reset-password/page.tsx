"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import { createClient } from "@/lib/supabase/client";

// Phase 78 — where the link in the password-recovery email (sent from
// app/forgot-password/page.tsx) lands. The Supabase browser client
// (lib/supabase/client.ts, createBrowserClient from @supabase/ssr) detects
// the recovery code in the URL automatically on load and exchanges it for a
// short-lived recovery session — no separate /auth/callback route or manual
// token parsing needed, this page just needs to call `updateUser` once that
// session exists. If someone opens this page without a valid/unexpired
// recovery link, `updateUser` fails with a real Supabase error (shown
// as-is), which is the correct behavior — there's no legitimate way to set
// a password here without one.
export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-soft">
          <h1 className="mb-2 text-2xl">Password updated</h1>
          <p className="mb-5 text-muted-fg">You can now sign in with your new password.</p>
          <Button href="/login">Go to sign in</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <h1 className="mb-1 text-2xl">Set a new password</h1>
        <p className="mb-6 text-sm text-muted-fg">Choose a new password for your account.</p>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const data = new FormData(e.currentTarget);
            const password = String(data.get("password") ?? "");
            const confirmPassword = String(data.get("confirm_password") ?? "");
            if (password !== confirmPassword) {
              setError("Passwords don't match.");
              return;
            }
            setPending(true);
            const supabase = createClient();
            const { error: updateError } = await supabase.auth.updateUser({ password });
            setPending(false);
            if (updateError) {
              setError(updateError.message);
              return;
            }
            setDone(true);
          }}
        >
          <div>
            <label htmlFor="reset-password-password" className="mb-1.5 block text-sm font-semibold">
              New password
            </label>
            <input
              id="reset-password-password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="reset-password-confirm" className="mb-1.5 block text-sm font-semibold">
              Confirm new password
            </label>
            <input
              id="reset-password-confirm"
              name="confirm_password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" block>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </section>
  );
}
