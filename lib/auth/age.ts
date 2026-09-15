// Phase 214 — shared "is this date of birth under 18" logic for the Create
// Account flow. A real calendar-age calculation (not just
// `thisYear - birthYear`), since a visitor whose birthday hasn't happened
// yet this year is still the age they were last year.
export function calculateAge(dateOfBirth: string, today: Date = new Date()): number {
  const dob = new Date(dateOfBirth + "T00:00:00");
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function isMinor(dateOfBirth: string, today: Date = new Date()): boolean {
  return calculateAge(dateOfBirth, today) < 18;
}

export function isValidPastDate(dateOfBirth: string, today: Date = new Date()): boolean {
  const dob = new Date(dateOfBirth + "T00:00:00");
  if (Number.isNaN(dob.getTime())) return false;
  // Reject future dates and anything implausibly old (past ~120 years) —
  // both are almost certainly typos, not real dates of birth.
  const age = calculateAge(dateOfBirth, today);
  return dob.getTime() <= today.getTime() && age >= 0 && age <= 120;
}

// Phase 214 — the exact wording a registrant agrees to (the T&C/Privacy
// checkbox) and a guardian agrees to on the minor's behalf, recorded
// against every consent for audit purposes (`profiles.terms_version` /
// `guardian_consents.terms_version`). Bump this string whenever the Terms &
// Conditions or Privacy Policy content materially changes, so historical
// consent rows keep meaning "agreed to the version that was live then," not
// a version number that's silently gone stale.
export const CURRENT_TERMS_VERSION = "2026-09-15";
