"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import type { ParticipatedBefore, SessionsCount } from "@/lib/database.types";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = CURRENT_YEAR - 100;
const MAX_BIRTH_YEAR_FOR_18 = CURRENT_YEAR - 18;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SESSIONS_COUNT_OPTIONS: { value: SessionsCount; label: string }[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "over_6", label: "Over 6 meetings" },
];

type FieldErrors = Partial<
  Record<
    | "clientName"
    | "clientPhone"
    | "clientEmail"
    | "clientCity"
    | "clientBirthYear"
    | "participatedBefore"
    | "sessionsCount"
    | "agreedTerms"
    | "agreedPrivacy"
    | "form",
    string
  >
>;

function idempotencyKeyFor(therapistId: string): string {
  const storageKey = `gesa_intake_key_${therapistId}`;
  if (typeof window === "undefined") return crypto.randomUUID();
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const fresh =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(storageKey, fresh);
  return fresh;
}

// Phase 128 — required client-intake step before "Choose a date and time"
// hands a client off to a therapist's own diary-link scheduler. Modeled
// closely on components/intake/IntakeBookingModal.tsx's existing
// name/email/phone/city/birth-year/consent pattern (same age-18 rule, same
// "store the moment consent was given, not just a boolean" approach) since
// it's solving the same underlying problem for a different flow — plus two
// new required dropdowns this flow specifically asked for.
export default function BookingIntakeForm({
  therapistId,
  therapistName,
  onCancel,
  onSuccess,
}: {
  therapistId: string;
  therapistName: string;
  onCancel: () => void;
  onSuccess: (intakeId: string) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(true);
  const [clientCity, setClientCity] = useState("");
  const [clientBirthYear, setClientBirthYear] = useState("");
  const [participatedBefore, setParticipatedBefore] = useState<ParticipatedBefore | "">("");
  const [sessionsCount, setSessionsCount] = useState<SessionsCount | "">("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [retryPayload, setRetryPayload] = useState<Record<string, unknown> | null>(null);

  // Generated once per therapist per browser session, and reused across
  // resubmits (a validation-error retry, or closing and reopening this
  // modal without a full page reload) — the API upserts on this key so
  // those retries never create a second intake row. Computed lazily rather
  // than in an effect so the very first submit already has it.
  const idempotencyKey = useMemo(() => idempotencyKeyFor(therapistId), [therapistId]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!clientName.trim()) next.clientName = "Full name is required.";
    if (!clientEmail.trim()) next.clientEmail = "Email address is required.";
    else if (!EMAIL_RE.test(clientEmail.trim())) next.clientEmail = "Enter a valid email address.";
    if (!clientPhone || !phoneValid) next.clientPhone = "Enter a valid phone number.";
    if (!clientCity.trim()) next.clientCity = "City / address is required.";
    const birthYearNum = Number(clientBirthYear);
    if (!clientBirthYear || !Number.isInteger(birthYearNum) || birthYearNum < MIN_BIRTH_YEAR || birthYearNum > CURRENT_YEAR) {
      next.clientBirthYear = "Enter a valid year of birth.";
    } else if (birthYearNum > MAX_BIRTH_YEAR_FOR_18) {
      next.clientBirthYear = "You must be at least 18 years old to book a session.";
    }
    if (!participatedBefore) next.participatedBefore = "Please select an answer.";
    if (!sessionsCount) next.sessionsCount = "Please select an answer.";
    if (!agreedTerms) next.agreedTerms = "You must agree to the terms and conditions.";
    if (!agreedPrivacy) next.agreedPrivacy = "You must confirm the privacy policy.";
    return next;
  }

  async function submit(payload: Record<string, unknown>) {
    setPending(true);
    setErrors((prev) => ({ ...prev, form: undefined }));
    try {
      const res = await fetch("/api/booking-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) {
        // Keep the payload around so "Try again" doesn't force the client
        // to retype everything — the form state itself is untouched either
        // way since we never clear it on failure.
        setRetryPayload(payload);
        setErrors((prev) => ({ ...prev, form: data?.error || "Something went wrong — please try again." }));
        return;
      }
      setRetryPayload(null);
      onSuccess(data.id as string);
    } catch {
      setRetryPayload(payload);
      setErrors((prev) => ({ ...prev, form: "Something went wrong — please try again." }));
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    await submit({
      therapistId,
      therapistName,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone,
      clientCity: clientCity.trim(),
      clientBirthYear: Number(clientBirthYear),
      participatedBefore,
      sessionsCount,
      agreedTerms,
      agreedPrivacy,
      idempotencyKey,
    });
  }

  // "Calendar failed to load" (see BookSessionButton) surfaces here as a
  // retry affordance too: the intake was already saved successfully, so
  // retrying just needs to re-run the same submit payload (an idempotent
  // upsert) so the parent can try opening the scheduler again — not force
  // the client to fill the form out a second time.
  async function onRetry() {
    if (!retryPayload) return;
    await submit(retryPayload);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="intake-name" className="mb-1.5 block text-sm font-semibold">
          Full Name <span className="text-destructive">*</span>
        </label>
        <input
          id="intake-name"
          required
          aria-required="true"
          aria-invalid={Boolean(errors.clientName)}
          aria-describedby={errors.clientName ? "intake-name-error" : undefined}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
        {errors.clientName && (
          <p id="intake-name-error" className="mt-1 text-[12.5px] text-destructive">
            {errors.clientName}
          </p>
        )}
      </div>

      <div>
        <PhoneNumberInput
          id="intake-phone"
          label="Phone Number *"
          value={clientPhone}
          onChange={(e164, isValid) => {
            setClientPhone(e164);
            setPhoneValid(isValid);
          }}
        />
        {errors.clientPhone && (
          <p id="intake-phone-error" className="mt-1 text-[12.5px] text-destructive">
            {errors.clientPhone}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="intake-email" className="mb-1.5 block text-sm font-semibold">
          Email Address <span className="text-destructive">*</span>
        </label>
        <input
          id="intake-email"
          type="email"
          required
          aria-required="true"
          aria-invalid={Boolean(errors.clientEmail)}
          aria-describedby={errors.clientEmail ? "intake-email-error" : undefined}
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
        {errors.clientEmail && (
          <p id="intake-email-error" className="mt-1 text-[12.5px] text-destructive">
            {errors.clientEmail}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="intake-city" className="mb-1.5 block text-sm font-semibold">
          City / Address <span className="text-destructive">*</span>
        </label>
        <textarea
          id="intake-city"
          required
          rows={2}
          aria-required="true"
          aria-invalid={Boolean(errors.clientCity)}
          aria-describedby={errors.clientCity ? "intake-city-error" : undefined}
          value={clientCity}
          onChange={(e) => setClientCity(e.target.value)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
        {errors.clientCity && (
          <p id="intake-city-error" className="mt-1 text-[12.5px] text-destructive">
            {errors.clientCity}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="intake-birth-year" className="mb-1.5 block text-sm font-semibold">
          Year of Birth <span className="text-destructive">*</span>
        </label>
        <input
          id="intake-birth-year"
          type="number"
          required
          inputMode="numeric"
          min={MIN_BIRTH_YEAR}
          max={CURRENT_YEAR}
          placeholder="e.g. 1990"
          aria-required="true"
          aria-invalid={Boolean(errors.clientBirthYear)}
          aria-describedby={errors.clientBirthYear ? "intake-birth-year-error" : undefined}
          value={clientBirthYear}
          onChange={(e) => setClientBirthYear(e.target.value)}
          className="w-full max-w-[160px] rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        />
        {errors.clientBirthYear && (
          <p id="intake-birth-year-error" className="mt-1 text-[12.5px] text-destructive">
            {errors.clientBirthYear}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="intake-participated" className="mb-1.5 block text-sm font-semibold">
          Did you participate in a meeting? <span className="text-destructive">*</span>
        </label>
        <select
          id="intake-participated"
          required
          aria-required="true"
          aria-invalid={Boolean(errors.participatedBefore)}
          aria-describedby={errors.participatedBefore ? "intake-participated-error" : undefined}
          value={participatedBefore}
          onChange={(e) => setParticipatedBefore(e.target.value as ParticipatedBefore)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Select an answer
          </option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        {errors.participatedBefore && (
          <p id="intake-participated-error" className="mt-1 text-[12.5px] text-destructive">
            {errors.participatedBefore}
          </p>
        )}
      </div>

      <div>
        {/* Deliberately always visible and required regardless of the
            answer above — per spec, this dropdown is not hidden when
            "Did you participate in a meeting?" is "No", unless a future
            product decision changes that. */}
        <label htmlFor="intake-sessions-count" className="mb-1.5 block text-sm font-semibold">
          How many sessions have you participated in? <span className="text-destructive">*</span>
        </label>
        <select
          id="intake-sessions-count"
          required
          aria-required="true"
          aria-invalid={Boolean(errors.sessionsCount)}
          aria-describedby={errors.sessionsCount ? "intake-sessions-count-error" : undefined}
          value={sessionsCount}
          onChange={(e) => setSessionsCount(e.target.value as SessionsCount)}
          className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Select an answer
          </option>
          {SESSIONS_COUNT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.sessionsCount && (
          <p id="intake-sessions-count-error" className="mt-1 text-[12.5px] text-destructive">
            {errors.sessionsCount}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border pt-4">
        <label className="flex items-start gap-2.5 text-[13px] text-muted-fg">
          <input
            type="checkbox"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.agreedTerms)}
            aria-describedby={errors.agreedTerms ? "intake-terms-error" : undefined}
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none"
          />
          <span>
            I confirm that I am over 18 years old and agree to the website&apos;s{" "}
            <a
              href="https://planetherapyglobal.org/en/terms-and-conditions-of-website/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline"
            >
              terms and conditions
            </a>
          </span>
        </label>
        {errors.agreedTerms && (
          <p id="intake-terms-error" className="text-[12.5px] text-destructive">
            {errors.agreedTerms}
          </p>
        )}

        <label className="flex items-start gap-2.5 text-[13px] text-muted-fg">
          <input
            type="checkbox"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.agreedPrivacy)}
            aria-describedby={errors.agreedPrivacy ? "intake-privacy-error" : undefined}
            checked={agreedPrivacy}
            onChange={(e) => setAgreedPrivacy(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none"
          />
          <span>
            I have read and understood the{" "}
            <a
              href="https://planetherapyglobal.org/en/our-privacy-policy/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline"
            >
              privacy policy
            </a>
          </span>
        </label>
        {errors.agreedPrivacy && (
          <p id="intake-privacy-error" className="text-[12.5px] text-destructive">
            {errors.agreedPrivacy}
          </p>
        )}
      </div>

      {errors.form && (
        <div className="flex flex-col items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3">
          <p className="text-[13.5px] text-destructive">{errors.form}</p>
          {retryPayload && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={pending}>
              {pending ? "Retrying…" : "Try again"}
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Submitting…" : "Continue to calendar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
