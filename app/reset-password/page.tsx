"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordRequirements from "@/components/ui/PasswordRequirements";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import { createClient } from "@/lib/supabase/client";
import { evaluatePassword } from "@/lib/auth/passwordPolicy";
import { friendlyResetPasswordError } from "@/lib/auth/authErrors";

// Phase 78 — where the link in the password-recovery email (sent from
// app/forgot-password/page.tsx) lands. The Supabase browser client
// (lib/supabase/client.ts, createBrowserClient from @supabase/ssr) detects
// the recovery code in the URL automatically on load and exchanges it for a
// short-lived recovery session — no separate /auth/callback route or manual
// token parsing needed, this page just needs to call `updateUser` once that
// session exists. If someone opens this page without a valid/unexpired
// recovery link, `updateUser` fails with a real Supabase error.
//
// Phase 175 — that failure used to be shown as Supabase's own raw error
// string (e.g. "Auth session missing"). Roy's spec asks for a "calm,
// helpful message and a CTA to request another reset link" instead —
// `friendlyResetPasswordError` (lib/auth/authErrors.ts) maps the known
// expired/invalid/reused-link error shapes to that copy and flags
// `linkExpired`, which swaps the submit button below for a "Request a new
// reset link" link instead of leaving a dead form on screen. Also added:
// the same 12-char/upper/lower/number/symbol strength policy as Sign Up
// (lib/auth/passwordPolicy.ts) with a live requirements checklist, and —
// once the password is actually updated — `supabase.auth.signOut({ scope:
// "others" })`, which asks GoTrue to invalidate every other active session
// for this account using the current (recovery) session's own access
// token. This needs no service-role/admin API call and works for every
// role, but matters most for admin accounts per the spec ("especially for
// administrator accounts") — a stolen admin session elsewhere is exactly
// what a password reset should kick out.
export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState("");

  if (done) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-soft">
          <h1 className="mb-2 text-2xl">Password updated</h1>
          {/* Phase 175 — wording matched to Roy's spec exactly. */}
          <p className="mb-5 text-muted-fg">Your password has been reset. Please sign in with your new password.</p>
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
            setLinkExpired(false);
            const data = new FormData(e.currentTarget);
            const passwordValue = String(data.get("password") ?? "");
            const confirmPassword = String(data.get("confirm_password") ?? "");
            if (passwordValue !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }
            const { passed } = evaluatePassword(passwordValue);
            if (!passed) {
              setError("Choose a stronger password that meets the requirements below.");
              return;
            }
            setPending(true);
            const supabase = createClient();
            const { error: updateError } = await supabase.auth.updateUser({ password: passwordValue });
            if (updateError) {
              setPending(false);
              const friendly = friendlyResetPasswordError(updateError);
              setError(friendly.message);
              setLinkExpired(friendly.linkExpired);
              return;
            }
            // Phase 175 — best-effort: revoke every other active session for
            // this account now that the password has changed. Uses the
            // current (recovery) session's own token via the regular client
            // auth API, not the service-role admin client, so it needs no
            // server round trip. Deliberately non-blocking — if this
            // particular call fails for some reason, the password change
            // itself already succeeded and that's what the user came here
            // for, so failure here is swallowed rather than surfaced as an
            // error on an otherwise-successful reset.
            await supabase.auth.signOut({ scope: "others" }).catch(() => {});
            setPending(false);
            setDone(true);
          }}
        >
          <PasswordInput
            id="reset-password-password"
            name="password"
            label="New password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={<PasswordRequirements password={password} />}
          />
          <PasswordInput id="reset-password-confirm" name="confirm_password" label="Confirm new password" required minLength={12} />
          {error && (
            <div className="text-sm text-destructive">
              <p>{error}</p>
              {/* Phase 175 — the CTA the spec asks for when a link is
                  expired/invalid/already used, so the visitor isn't left
                  stuck resubmitting a form that can never succeed. */}
              {linkExpired && (
                <Link href="/forgot-password" className="mt-1 inline-block font-semibold text-primary">
                  Request a new password reset link
                </Link>
              )}
            </div>
          )}
          <Button type="submit" disabled={pending} block>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </section>
  );
}
