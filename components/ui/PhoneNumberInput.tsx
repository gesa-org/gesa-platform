"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

// Phase 125 — built for the CRM's "Edit Professional" phone field (Roy's
// spec: a country selector with flag/name/dial-code next to a number input,
// automatic country detection from a pasted "+..." number, E.164 storage,
// friendly validation). Uses `libphonenumber-js` for all parsing/validation/
// formatting rather than hand-rolled regex, per Roy's explicit instruction —
// it already ships a full, maintained table of every country's dialing
// code, national-number length, and trunk-prefix rules, so there's nothing
// to hand-maintain here.
//
// Country display names come from `Intl.DisplayNames` (built into every
// modern browser) rather than a second hand-written "country code -> name"
// list — the one thing `libphonenumber-js` itself doesn't provide. Flags
// are rendered as emoji, computed from the ISO code (regional-indicator
// Unicode trick) rather than shipping 240+ flag image assets; on the rare
// platform that can't render flag-emoji glyphs (older Windows Chrome is the
// known case) the two-letter code shows instead of a flag — a harmless
// fallback, not a broken one.
const REGION_NAMES = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

type CountryOption = { code: CountryCode; name: string; dial: string; flag: string };

// Computed once at module load, not per render — this list is the same for
// every instance of the field and every user.
const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: REGION_NAMES?.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
    flag: flagEmoji(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export type PhoneNumberInputProps = {
  id?: string;
  label?: string;
  /** Current value as E.164 (e.g. "+639171234567"), or empty/null if unset. */
  value: string | null;
  /**
   * Called on every change. `e164` is the normalized E.164 value when the
   * current input is a valid, complete number; `null` when the field is
   * empty or not yet a valid number (callers should not save `null` unless
   * the field is also empty — check `isValid`/whether the raw text is
   * blank to distinguish "cleared" from "still typing an invalid number").
   */
  onChange: (e164: string | null, isValid: boolean) => void;
  helpText?: string;
};

export default function PhoneNumberInput({ id, label = "Phone Number", value, onChange, helpText }: PhoneNumberInputProps) {
  const [country, setCountry] = useState<CountryCode | undefined>(undefined);
  const [rawInput, setRawInput] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  // Parse the saved E.164 value once on mount so reopening the edit form
  // preselects the right country and shows a readable national-format
  // number rather than the raw "+639171234567" string. Deliberately an
  // empty dependency array, not `[value]`: this component's own `onChange`
  // pushes updates back up into the parent's state on every keystroke
  // (including transient `null`s while a number is mid-type/invalid), and
  // if this effect re-ran on every `value` change it would stomp whatever
  // the admin is currently typing. If a caller ever reuses one mounted
  // instance of this field across two different records, pass a `key`
  // prop that changes with the record's id so React remounts it — the same
  // thing TherapistEditForm's other plain `useState(initialValue)` fields
  // would also need, since none of them re-sync on prop change either.
  useEffect(() => {
    if (!value) return;
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) {
      setCountry(parsed.country);
      setRawInput(parsed.formatNational());
    } else {
      // Legacy/unparsable data (e.g. a free-text number saved before this
      // field existed) — show it as-is rather than silently blanking it,
      // and let the admin re-enter it properly.
      setRawInput(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => COUNTRY_OPTIONS.find((c) => c.code === country), [country]);

  function evaluate(text: string, countryHint: CountryCode | undefined) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("");
      onChange(null, true);
      return;
    }
    const parsed = trimmed.startsWith("+")
      ? parsePhoneNumberFromString(trimmed)
      : parsePhoneNumberFromString(trimmed, countryHint);

    if (parsed?.country && trimmed.startsWith("+") && parsed.country !== countryHint) {
      // Requirement 1/2 — a pasted/typed "+..." number auto-selects the
      // matching country in the dropdown.
      setCountry(parsed.country);
    }

    if (parsed?.isValid()) {
      setError("");
      onChange(parsed.number, true); // .number is the E.164 form
    } else {
      setError("Enter a valid international phone number.");
      onChange(null, false);
    }
  }

  function handleTextChange(text: string) {
    // Allow + digits spaces parentheses hyphens while typing/pasting;
    // strip letters and other stray characters immediately rather than on
    // blur, per Roy's spec ("prevent invalid letters ... while still
    // allowing +, spaces, parentheses, and hyphens").
    const cleaned = text.replace(/[^\d+\s()-]/g, "");
    setRawInput(cleaned);
    evaluate(cleaned, country);
  }

  function handleCountryChange(code: CountryCode) {
    setCountry(code);
    // Requirement 4 — changing the country updates the dial code without
    // deleting whatever national number was already typed.
    if (rawInput.trim()) evaluate(rawInput, code);
  }

  const describedBy = error && touched ? `${id}-error` : helpText ? `${id}-help` : undefined;

  return (
    <div>
      <label htmlFor={`${id}-number`} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="sm:w-[230px] sm:flex-none">
          <label htmlFor={`${id}-country`} className="sr-only">
            Country
          </label>
          <select
            id={`${id}-country`}
            dir="ltr"
            value={country ?? ""}
            onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[14px] focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              Select country…
            </option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dial})
              </option>
            ))}
          </select>
        </div>
        <input
          id={`${id}-number`}
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          value={rawInput}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={selected ? selected.dial.replace("+", "e.g. +") : "e.g. +63 917 123 4567"}
          aria-invalid={Boolean(error && touched)}
          aria-describedby={describedBy}
          className="w-full flex-1 rounded-xl border border-border px-3.5 py-2.5 text-left focus:border-primary focus:outline-none"
        />
      </div>
      {error && touched ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] font-medium text-destructive">
          {error}
        </p>
      ) : helpText ? (
        <p id={`${id}-help`} className="mt-1.5 text-[12.5px] text-muted-fg">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
