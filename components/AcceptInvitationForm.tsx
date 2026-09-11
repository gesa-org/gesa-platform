"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordRequirements from "@/components/ui/PasswordRequirements";
import { createClient } from "@/lib/supabase/client";
import { evaluatePassword } from "@/lib/auth/passwordPolicy";
import type { InvitedRole } from "@/lib/database.types";

// Phase 187 — the account-setup form rendered once /accept-invitation has
// already validated the token server-side (see that page's own comment).
// Submits to /api/invitations/accept (which creates the real account and
// sets the correct role — see that route), then immediately calls
// supabase.auth.signInWithPassword itself with the same credentials to
// establish the browser's cookie session, since the service-role client
// used server-side has no concept of a session to hand back. Password never
// leaves this component except in that one sign-in call and the initial
// accept POST — never logged, never put in a URL.
export default function AcceptInvitationForm({
  token,
  email,
  invitedRole,
  defaultFullName,
}: {
  token: string;
  email: string;
  invitedRole: InvitedRole;
  defaultFullName: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName);
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget as HTMLFormElement);
    const confirmPassword = String(data.get("confirm_password") ?? "");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const { passed } = evaluatePassword(password);
    if (!passed) {
      setError("Choose a stronger password that meets the requirements below.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions and Privacy Policy to continue.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName, password, acceptedTerms }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        setError(result?.error || "Could not set up your account — please try again.");
        setPending(false);
        return;
      }

      // Establish the real browser session now that the account exists.
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setPending(false);
      if (signInError) {
        // The account itself was created successfully — send them to login
        // rather than stranding them on a broken page.
        router.push("/login?next=" + encodeURIComponent(invitedRole === "therapist" ? "/therapist" : "/admin"));
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(invitedRole === "therapist" ? "/therapist" : "/admin");
      }, 1200);
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h2 className="mb-2 text-lg font-semibold">Account created</h2>
        <p className="text-sm text-muted-fg">
          You&apos;re signed in — taking you to your {invitedRole === "therapist" ? "professional dashboard" : "CRM dashboard"} now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <div>
        <label htmlFor="accept-email" className="mb-1.5 block text-sm font-semibold">Email</label>
        <input id="accept-email" value={email} disabled readOnly className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-muted-fg" />
      </div>
      <div>
        <label htmlFor="accept-full-name" className="mb-1.5 block text-sm font-semibold">Full name</label>
        <input
          id="accept-full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
      </div>
      <PasswordInput
        id="accept-password"
        name="password"
        label="Create a password"
        required
        minLength={12}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={<PasswordRequirements password={password} />}
      />
      <PasswordInput id="accept-confirm-password" name="confirm_password" label="Confirm password" required minLength={12} />

      <label className="flex items-start gap-2 text-[13px] text-muted-fg">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 flex-none accent-primary"
        />
        <span>
          I agree to GESA&apos;s{" "}
          <Link href="/terms-and-conditions" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending} block>
        {pending ? "Setting up your account…" : "Create your account"}
      </Button>
    </form>
  );
}
