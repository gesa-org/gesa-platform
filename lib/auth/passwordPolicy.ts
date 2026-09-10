// Phase 175 — shared password-strength policy for every place a person
// chooses a *new* password (Sign Up, Reset Password, Change Password).
// Deliberately not applied to Sign In's password field — that one is
// checking an existing password against whatever rules were in force when
// the account was created, not enforcing today's policy retroactively.
//
// Requirements (Roy's spec, "unless the auth provider already enforces a
// stronger policy" — Supabase's own default is just a length minimum, so
// this is the actual effective policy):
//   - at least 12 characters
//   - at least one uppercase letter
//   - at least one lowercase letter
//   - at least one number
//   - at least one symbol
// Kept as small, named, independently-testable rules (not one big regex)
// so the inline UI can show exactly which requirement(s) are still unmet,
// rather than a single pass/fail.
export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "At least 12 characters", test: (p) => p.length >= 12 },
  { id: "uppercase", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "One symbol (e.g. ! ? # % &)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// A small, non-exhaustive list of passwords that show up at the top of
// every public breach dump — this is deliberately not trying to be a full
// "have I been pwned"-style check (that needs a network call this form
// doesn't make), just a cheap, safe backstop against the most obviously
// compromised choices slipping through despite otherwise meeting the rules
// above (e.g. "Password123!" passes every rule above but is one of the
// most-breached strings in existence).
const COMMONLY_COMPROMISED = new Set([
  "password123!",
  "password1234",
  "qwerty123456",
  "letmein12345",
  "welcome12345",
  "iloveyou1234",
  "administrator",
  "changeme123!",
]);

export function isCommonlyCompromised(password: string): boolean {
  return COMMONLY_COMPROMISED.has(password.trim().toLowerCase());
}

export function evaluatePassword(password: string) {
  const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(password));
  const compromised = password.length > 0 && isCommonlyCompromised(password);
  return {
    passed: failedRules.length === 0 && !compromised,
    failedRules,
    compromised,
  };
}

// One combined message for a top-level form error (inline per-rule display
// is preferred in the UI — see PasswordRequirements component — this is a
// fallback for contexts that only show a single string, e.g. a toast).
export function passwordPolicyMessage(password: string): string | null {
  const { passed, compromised } = evaluatePassword(password);
  if (passed) return null;
  if (compromised) return "Choose a stronger password — this one shows up in common breach lists.";
  return "Choose a stronger password that meets the requirements below.";
}
