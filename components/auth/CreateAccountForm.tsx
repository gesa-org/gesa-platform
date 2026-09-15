"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordRequirements from "@/components/ui/PasswordRequirements";
import CountrySelector from "@/components/crisis/CountrySelector";
import VolunteerApplyButton from "@/components/volunteer/VolunteerApplyButton";
import { createClient } from "@/lib/supabase/client";
import { evaluatePassword } from "@/lib/auth/passwordPolicy";
import { isValidEmailFormat } from "@/lib/email/resend";
import { isValidPastDate, isMinor, CURRENT_TERMS_VERSION } from "@/lib/auth/age";
import { COUNTRY_OPTIONS } from "@/lib/countries";

// Phase 214 — full client/user "Create Account" flow, replacing the plain
// full_name + email + password form app/signup/page.tsx used to render
// directly. Split out into its own component so the same form can also
// live inside the new tabbed /account-access page the footer's "Sign In /
// Create Account" link opens (see Footer.tsx), not just at the standalone
// /signup route.
//
// Under-18 handling: this form NEVER creates an immediately-usable minor
// account. `date_of_birth` decides, live as the visitor types, whether the
// guardian section below appears; on submit, a minor's Supabase Auth
// account is still created (so the guardian's later consent has something
// real to activate — see SignInForm.tsx's gate and the Phase 214 migration)
// but with `account_status: "pending_guardian_consent"` in the signUp
// metadata, which handle_new_user() writes straight onto the new profiles
// row. Right after that succeeds, this form calls
// POST /api/auth/guardian-consent (lib/guardianConsent.ts) to create the
// consent record and email the guardian — the actual
// "I am the parent/guardian and I agree on their behalf" checkbox the spec
// asks for is NOT rendered here: only the guardian can truthfully check
// that box, so it lives on the page they land on after clicking the emailed
// link (components/auth/GuardianConsentForm.tsx), not duplicated here where
// the minor would be checking it on the guardian's behalf. What IS
// collected here from the minor is the separate, minor-truthful checkbox
// the spec also asks for ("I confirm that my parent or legal guardian knows
// that I am requesting a GESA account"), plus the guardian's contact
// details so GESA knows who to email.
export default function CreateAccountForm({ onDone }: { onDone?: () => void } = {}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Minor-only fields
  const [guardianAware, setGuardianAware] = useState(false);
  const [guardianFullName, setGuardianFullName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"adult" | "minor" | null>(null);

  const dobValid = dateOfBirth !== "" && isValidPastDate(dateOfBirth);
  const minorFlow = dobValid && isMinor(dateOfBirth);
  const passwordEval = useMemo(() => evaluatePassword(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const emailValid = isValidEmailFormat(email);
  const guardianEmailValid = isValidEmailFormat(guardianEmail);

  const baseFieldsValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailValid &&
    passwordEval.passed &&
    passwordsMatch &&
    dobValid &&
    agreedTerms;

  const minorFieldsValid =
    !minorFlow ||
    (guardianAware && guardianFullName.trim().length > 0 && guardianEmailValid && guardianRelationship.trim().length > 0);

  const canSubmit = baseFieldsValid && minorFieldsValid && !pending;

  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  if (done === "adult") {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-2xl">Check your email</h1>
        <p className="text-muted-fg">We&apos;ve sent a confirmation link to finish setting up your account.</p>
      </div>
    );
  }

  if (done === "minor") {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-2xl">Almost there</h1>
        <p className="text-muted-fg">
          Because you&apos;re under 18, we&apos;ve emailed{" "}
          {guardianFullName ? <strong>{guardianFullName}</strong> : "your parent or legal guardian"} to confirm
          consent. Your account will be ready to use as soon as they do — there&apos;s nothing else you need to do
          right now.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setTouched({
          firstName: true,
          lastName: true,
          email: true,
          password: true,
          confirmPassword: true,
          dateOfBirth: true,
          terms: true,
          guardianAware: true,
          guardianFullName: true,
          guardianEmail: true,
          guardianRelationship: true,
        });
        if (!canSubmit) return;

        setSubmitError(null);
        setPending(true);

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const nowIso = new Date().toISOString();
        const supabase = createClient();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName,
              role: "client",
              country: country ?? "",
              date_of_birth: dateOfBirth,
              account_status: minorFlow ? "pending_guardian_consent" : "active",
              terms_accepted_at: nowIso,
              terms_version: CURRENT_TERMS_VERSION,
            },
          },
        });

        if (signUpError) {
          setPending(false);
          setSubmitError(signUpError.message);
          return;
        }

        if (minorFlow && signUpData.user) {
          const res = await fetch("/api/auth/guardian-consent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId: signUpData.user.id,
              minorName: fullName,
              guardianFullName,
              guardianEmail,
              guardianRelationship,
            }),
          });
          if (!res.ok) {
            // The account exists (pending) even if this particular request
            // failed to send — surface a specific, actionable message
            // rather than the generic success screen, since the guardian
            // otherwise has no way to know they need to act.
            setPending(false);
            setSubmitError("Your account was created, but we couldn't send the guardian-consent email. Please contact GESA support.");
            return;
          }
        }

        setPending(false);
        if (!minorFlow) {
          fetch("/api/email/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, fullName }),
          }).catch(() => {});
        }
        setDone(minorFlow ? "minor" : "adult");
        onDone?.();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="signup-first-name" className="mb-1.5 block text-sm font-semibold">
            First name
          </label>
          <input
            id="signup-first-name"
            name="first_name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => markTouched("firstName")}
            aria-invalid={touched.firstName && firstName.trim().length === 0}
            aria-describedby="signup-first-name-error"
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          {touched.firstName && firstName.trim().length === 0 && (
            <p id="signup-first-name-error" role="alert" className="mt-1 text-[12.5px] text-destructive">
              First name is required.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="signup-last-name" className="mb-1.5 block text-sm font-semibold">
            Last name
          </label>
          <input
            id="signup-last-name"
            name="last_name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => markTouched("lastName")}
            aria-invalid={touched.lastName && lastName.trim().length === 0}
            aria-describedby="signup-last-name-error"
            className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
          />
          {touched.lastName && lastName.trim().length === 0 && (
            <p id="signup-last-name-error" role="alert" className="mt-1 text-[12.5px] text-destructive">
              Last name is required.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => markTouched("email")}
          aria-invalid={touched.email && !emailValid}
          aria-describedby="signup-email-error"
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
        {touched.email && !emailValid && (
          <p id="signup-email-error" role="alert" className="mt-1 text-[12.5px] text-destructive">
            Enter a valid email address.
          </p>
        )}
      </div>

      <PasswordInput
        id="signup-password"
        name="password"
        label="Password"
        required
        minLength={12}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => markTouched("password")}
        hint={<PasswordRequirements password={password} />}
      />
      <div>
        <PasswordInput
          id="signup-confirm-password"
          name="confirm_password"
          label="Confirm password"
          required
          minLength={12}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => markTouched("confirmPassword")}
        />
        {touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch && (
          <p role="alert" className="mt-1 text-[12.5px] text-destructive">
            Passwords do not match.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="signup-dob" className="mb-1.5 block text-sm font-semibold">
          Date of birth
        </label>
        <input
          id="signup-dob"
          name="date_of_birth"
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          onBlur={() => markTouched("dateOfBirth")}
          aria-invalid={touched.dateOfBirth && !dobValid}
          aria-describedby="signup-dob-error"
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
        {touched.dateOfBirth && !dobValid && (
          <p id="signup-dob-error" role="alert" className="mt-1 text-[12.5px] text-destructive">
            Enter a valid date of birth.
          </p>
        )}
      </div>

      {/* Country/region — reuses the same searchable combobox the Crisis
          flow already built (components/crisis/CountrySelector.tsx) rather
          than a new field, per the request's "if already supported by the
          platform" — it is. Not marked required: `profiles.country` is
          nullable and several existing flows on this site treat country as
          optional context, not a hard registration gate. */}
      <CountrySelector
        value={country}
        onChange={setCountry}
        id="signup-country"
        label="Country / region"
        placeholder="Choose a country (optional)"
      />

      {minorFlow && (
        <div className="flex flex-col gap-3.5 rounded-xl border border-amber/40 bg-clay-soft p-4">
          <p className="text-[13.5px] leading-relaxed text-foreground">
            Because you&apos;re under 18, a parent or legal guardian needs to confirm they know about this account
            before it can be used. We&apos;ll email them a link — your account will be ready as soon as they
            confirm.
          </p>
          <label className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
            <input
              type="checkbox"
              checked={guardianAware}
              onChange={(e) => setGuardianAware(e.target.checked)}
              onBlur={() => markTouched("guardianAware")}
              required
              className="mt-0.5 h-4 w-4 flex-none rounded border-border text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <span>I confirm that my parent or legal guardian knows that I am requesting a GESA account.</span>
          </label>
          {touched.guardianAware && !guardianAware && (
            <p role="alert" className="text-[12.5px] text-destructive">
              Please confirm your parent or legal guardian knows before continuing.
            </p>
          )}

          <div>
            <label htmlFor="guardian-full-name" className="mb-1.5 block text-sm font-semibold">
              Guardian full name
            </label>
            <input
              id="guardian-full-name"
              value={guardianFullName}
              onChange={(e) => setGuardianFullName(e.target.value)}
              onBlur={() => markTouched("guardianFullName")}
              required
              aria-invalid={touched.guardianFullName && guardianFullName.trim().length === 0}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            {touched.guardianFullName && guardianFullName.trim().length === 0 && (
              <p role="alert" className="mt-1 text-[12.5px] text-destructive">
                Guardian name is required.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="guardian-email" className="mb-1.5 block text-sm font-semibold">
              Guardian email address
            </label>
            <input
              id="guardian-email"
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              onBlur={() => markTouched("guardianEmail")}
              required
              aria-invalid={touched.guardianEmail && !guardianEmailValid}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            {touched.guardianEmail && !guardianEmailValid && (
              <p role="alert" className="mt-1 text-[12.5px] text-destructive">
                Enter a valid guardian email address.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="guardian-relationship" className="mb-1.5 block text-sm font-semibold">
              Guardian&apos;s relationship to you
            </label>
            <input
              id="guardian-relationship"
              placeholder="e.g. Parent, Legal guardian"
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value)}
              onBlur={() => markTouched("guardianRelationship")}
              required
              aria-invalid={touched.guardianRelationship && guardianRelationship.trim().length === 0}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
            {touched.guardianRelationship && guardianRelationship.trim().length === 0 && (
              <p role="alert" className="mt-1 text-[12.5px] text-destructive">
                Let us know the guardian&apos;s relationship to you.
              </p>
            )}
          </div>
        </div>
      )}

      <label className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
        <input
          type="checkbox"
          checked={agreedTerms}
          onChange={(e) => setAgreedTerms(e.target.checked)}
          onBlur={() => markTouched("terms")}
          required
          aria-describedby="signup-terms-error"
          className="mt-0.5 h-4 w-4 flex-none rounded border-border text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span>
          I have read and agree to the GESA{" "}
          <Link href="/terms-and-conditions" className="font-semibold text-primary" target="_blank" rel="noreferrer">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="font-semibold text-primary" target="_blank" rel="noreferrer">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {touched.terms && !agreedTerms && (
        <p id="signup-terms-error" role="alert" className="text-[12.5px] text-destructive">
          You must agree to the Terms &amp; Conditions and Privacy Policy to continue.
        </p>
      )}

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={!canSubmit} block>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-[12.5px] text-muted-fg">
        For clients tracking sessions and chat. Therapists apply via{" "}
        <VolunteerApplyButton className="font-semibold text-primary">volunteer application</VolunteerApplyButton>.
      </p>
    </form>
  );
}

// Re-exported so tests/other components can reference the same option list
// this form's CountrySelector reads from without importing lib/countries.ts
// directly in more than one place.
export const SIGNUP_COUNTRY_OPTIONS = COUNTRY_OPTIONS;
