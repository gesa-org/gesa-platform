"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";

// Phase 214 — extracted from app/login/page.tsx (which now renders this
// directly) so the exact same sign-in logic — including the new guardian-
// consent gate below — can also be reused inside the tabbed /account-access
// landing page the footer's new "Sign In / Create Account" link opens.
// Nothing about the actual Supabase Auth call changed; the only new
// behavior is the post-sign-in status check.
//
// Guardian-consent gate: Supabase Auth has no concept of "this account
// isn't allowed to sign in yet" — signInWithPassword succeeds and returns a
// real session the moment email+password match, regardless of anything in
// `profiles`. So a minor's account (created with `account_status:
// "pending_guardian_consent"` — see CreateAccountForm.tsx) can always
// authenticate at the Supabase layer; the block has to happen here, one
// beat later: read the freshly-signed-in user's own profile (readable via
// profiles_self_select, same as everywhere else in the app) and, if it's
// not "active", immediately sign the session back out before this
// component ever treats the visitor as signed in or redirects anywhere.
// This intentionally never distinguishes "wrong password" from "this email
// doesn't have an account" in its own error copy (see the shared message
// below) — only the guardian-pending case gets a distinct, named message,
// since that's not a security-sensitive fact to reveal to someone who just
// proved they know the account's password.
export default function SignInForm({ onSignedIn }: { onSignedIn?: () => void } = {}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingGuardian, setPendingGuardian] = useState(false);
  const [pending, setPending] = useState(false);

  if (pendingGuardian) {
    return (
      <div className="rounded-xl border border-amber/40 bg-clay-soft p-4 text-[14px] leading-relaxed text-foreground">
        <p className="font-semibold">This account is waiting on parent/guardian consent.</p>
        <p className="mt-1.5 text-muted-fg">
          We&apos;ve emailed the parent or legal guardian named on this account. Once they confirm consent, this
          account can sign in right away — there&apos;s nothing else needed from you in the meantime.
        </p>
        <p className="mt-2.5 text-muted-fg">
          Guardian hasn&apos;t received the email?{" "}
          <a href="mailto:hello@gesa.org" className="font-semibold text-primary">
            Contact GESA support
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const data = new FormData(e.currentTarget);
        const supabase = createClient();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
        });
        if (signInError) {
          setPending(false);
          setError(signInError.message);
          return;
        }

        const userId = signInData.user?.id;
        if (userId) {
          const { data: profile } = await supabase.from("profiles").select("account_status").eq("id", userId).maybeSingle();
          if (profile?.account_status === "pending_guardian_consent") {
            await supabase.auth.signOut();
            setPending(false);
            setPendingGuardian(true);
            return;
          }
        }

        setPending(false);
        if (onSignedIn) {
          onSignedIn();
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
        {/* Phase 214 — this field's label previously had no htmlFor/id
            association at all (a pre-existing gap, carried over unnoticed
            from before this phase's extraction). Given this phase's own
            accessibility requirements for the new Create Account flow,
            fixed here too while this file was already being touched. */}
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-semibold">
            Password
          </label>
          <Link href="/forgot-password" className="text-[13px] font-semibold text-primary">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="login-password" name="password" required />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} block>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
