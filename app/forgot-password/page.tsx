"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

// Phase 78 — the login page had no way for a user who forgot their password
// to get back into their account; this page (linked from a new "Forgot
// password?" link on app/login/page.tsx) sends them a real Supabase
// password-recovery email. Mirrors app/signup/page.tsx's card shell and
// "done" confirmation-state pattern for visual consistency with the rest of
// the auth flow. The emailed link points at /reset-password (new page,
// same phase) where the user actually sets a new password.
//
// Supabase always returns a success response from resetPasswordForEmail
// regardless of whether the address is registered, by design (so this
// can't be used to enumerate which emails have accounts) — the UI shows the
// same "check your email" confirmation either way, which is the correct,
// expected behavior here, not a bug to fix.
export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-soft">
          <h1 className="mb-2 text-2xl">Check your email</h1>
          <p className="text-muted-fg">
            If an account exists for that address, we&apos;ve sent a link to reset your password.
          </p>
          <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-primary">
            Back to sign in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          GESA
        </Link>
        <h1 className="mb-1 text-2xl">Reset your password</h1>
        <p className="mb-6 text-sm text-muted-fg">
          Enter the email on your account and we&apos;ll send you a link to set a new password.
        </p>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            const data = new FormData(e.currentTarget);
            const email = String(data.get("email") ?? "");
            const supabase = createClient();
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
            });
            setPending(false);
            if (resetError) {
              setError(resetError.message);
              return;
            }
            setDone(true);
          }}
        >
          <div>
            <label htmlFor="forgot-password-email" className="mb-1.5 block text-sm font-semibold">
              Email
            </label>
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" block>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-fg">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
