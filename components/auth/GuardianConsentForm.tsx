"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";

// Phase 214 — the guardian's actual confirmation step, shown on
// /guardian-consent once the server component (page.tsx) has already
// confirmed the token is valid, unexpired, and not yet used. A real
// checkbox gate (button stays disabled until checked), matching the same
// "explicit, no defaults" pattern CreateAccountForm.tsx's own consent
// checkboxes use.
export default function GuardianConsentForm({ token, minorName }: { token: string; minorName: string | null }) {
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-2xl">Consent confirmed</h1>
        <p className="text-muted-fg">
          Thank you — {minorName ? `${minorName}'s` : "the"} GESA account is now active. They can sign in right away.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-2xl">Guardian consent</h1>
      <p className="mb-6 text-sm text-muted-fg">
        {minorName ? (
          <>
            <strong>{minorName}</strong> has asked to create a GESA account for free, confidential mental-health
            support.
          </>
        ) : (
          "A young person has asked to create a GESA account for free, confidential mental-health support."
        )}{" "}
        Because they&apos;re under 18, GESA requires your consent as their parent or legal guardian before the
        account can be activated.
      </p>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const res = await fetch("/api/auth/guardian-consent/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, consent: checked }),
          });
          setPending(false);
          if (!res.ok) {
            const body = await res.json().catch(() => null);
            setError(body?.error || "Something went wrong — please try again.");
            return;
          }
          setDone(true);
        }}
      >
        <label className="flex items-start gap-2.5 text-[14px] leading-relaxed">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            required
            className="mt-1 h-4 w-4 flex-none rounded border-border text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-describedby="guardian-consent-checkbox-label"
          />
          <span id="guardian-consent-checkbox-label">
            I am the parent or legal guardian of this user, and I agree to the GESA{" "}
            <Link href="/terms-and-conditions" className="font-semibold text-primary" target="_blank" rel="noreferrer">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-semibold text-primary" target="_blank" rel="noreferrer">
              Privacy Policy
            </Link>{" "}
            on their behalf.
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={!checked || pending} block>
          {pending ? "Confirming…" : "Confirm consent"}
        </Button>
      </form>
    </>
  );
}
