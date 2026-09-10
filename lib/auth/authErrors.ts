// Phase 175 — maps raw Supabase Auth error messages to the calm, generic
// copy Roy's spec asks for, so nothing backend-specific (rate-limit
// internals, whether a token exists, provider-side wording) reaches the
// screen. Every branch here falls back to a safe generic message rather
// than ever showing `error.message` verbatim — the previous forgot-password/
// reset-password pages did show the raw Supabase string, which is what this
// phase changes.
//
// Deliberately matched by *substring* against Supabase's actual GoTrue
// error strings (checked against the supabase-js version this repo pins,
// package.json's "@supabase/supabase-js") rather than by error code, since
// the JS client doesn't consistently expose a stable machine-readable code
// for all of these — substring matching on the English message is the
// pragmatic option here, same as this codebase's existing error handling
// elsewhere (see e.g. its GesaMark/queries error paths). If Supabase's
// wording changes upstream, the fallback generic message still applies
// safely — this only ever gets *friendlier*, never leaks the raw string.
function messageOf(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return String(error ?? "");
}

const RATE_LIMIT_PATTERNS = [/rate limit/i, /too many/i, /only request this after/i, /429/];
const NETWORK_PATTERNS = [/network/i, /fetch failed/i, /failed to fetch/i, /timed out/i];
const INVALID_OR_EXPIRED_PATTERNS = [
  /expired/i,
  /invalid.*(token|link|code|otp)/i,
  /(token|link|code|otp).*invalid/i,
  /session.*missing/i,
  /auth session missing/i,
  /flow_state_not_found/i,
];

/** For the "request a reset link" form (app/forgot-password/page.tsx). */
export function friendlyForgotPasswordError(error: unknown): string {
  const message = messageOf(error);
  if (RATE_LIMIT_PATTERNS.some((re) => re.test(message))) {
    return "Too many reset requests. Please wait a few minutes and try again.";
  }
  if (NETWORK_PATTERNS.some((re) => re.test(message))) {
    return "We could not complete that request right now. Please try again.";
  }
  // Anything else (malformed email slipping past client validation,
  // unexpected provider errors, etc.) — same generic fallback, never the
  // raw provider string. Supabase's resetPasswordForEmail already never
  // errors just because an email isn't registered (see this file's own
  // header note and app/forgot-password/page.tsx), so nothing role- or
  // account-specific can reach this branch.
  return "We could not complete that request right now. Please try again.";
}

/** For the "set a new password" form (app/reset-password/page.tsx). */
export function friendlyResetPasswordError(error: unknown): {
  message: string;
  linkExpired: boolean;
} {
  const message = messageOf(error);
  if (INVALID_OR_EXPIRED_PATTERNS.some((re) => re.test(message))) {
    return {
      message: "This reset link is no longer valid. Request a new password reset link.",
      linkExpired: true,
    };
  }
  if (RATE_LIMIT_PATTERNS.some((re) => re.test(message))) {
    return { message: "Too many attempts. Please wait a few minutes and try again.", linkExpired: false };
  }
  if (NETWORK_PATTERNS.some((re) => re.test(message))) {
    return { message: "We could not complete that request right now. Please try again.", linkExpired: false };
  }
  return { message: "We could not complete that request right now. Please try again.", linkExpired: false };
}

/** For the Account Settings "change password" form. */
export function friendlyChangePasswordError(error: unknown): string {
  const message = messageOf(error);
  if (/same.*password|should be different/i.test(message)) {
    return "Your new password must be different from your current password.";
  }
  if (RATE_LIMIT_PATTERNS.some((re) => re.test(message))) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (NETWORK_PATTERNS.some((re) => re.test(message))) {
    return "We could not complete that request right now. Please try again.";
  }
  return "We could not complete that request right now. Please try again.";
}
