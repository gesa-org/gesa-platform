"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

// Phase 175 — shared "show/hide password" field, used everywhere a visitor
// types a password: Sign In, Sign Up (password + new Confirm Password),
// Reset Password (new password + confirm), and the new Change Password
// section in Account Settings. Built once here rather than copy-pasted per
// page so every password field in the app behaves identically and any
// future fix/tweak (icon, touch-target size, focus ring) only needs to
// happen in one place.
//
// Behavior, matching the request precisely:
// - Starts masked (`type="password"`); the toggle button flips it to
//   `type="text"` and back — never anything else, never clears/revalidates
//   the value just because visibility changed (the input's own `value`/
//   `defaultValue` is completely untouched by the toggle).
// - The toggle is a real `<button type="button">` (never submits the
//   surrounding form) with an accessible name that changes between "Show
//   password" and "Hide password", plus `aria-pressed` reflecting the
//   current state for screen readers/other AT.
// - Each instance owns its own `visible` state — two `PasswordInput`s on
//   the same form (e.g. "Password" and "Confirm Password") toggle
//   completely independently, since this is a per-component `useState`, not
//   anything shared or keyed globally.
// - `w-11` (44px) touch target on the toggle button, matching the WCAG/iOS
//   minimum recommended hit area for mobile.
// - Standard tab order (the toggle is a normal focusable button right after
//   the input in DOM order) and a visible `focus-visible` ring — no custom
//   keydown handling needed since a native `<button>` already supports
//   Enter/Space activation for free.
export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Omit when the page already renders its own <label htmlFor> for this input elsewhere (e.g. sharing a row with a "Forgot password?" link) — never render two <label> elements for the same field. */
  label?: ReactNode;
  /** Optional content rendered below the input — e.g. password requirements or an inline error. */
  hint?: ReactNode;
  labelClassName?: string;
  containerClassName?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, hint, id, name, className = "", labelClassName = "", containerClassName = "", ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? `password-${autoId}`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={containerClassName}>
      {label !== undefined && (
        <label htmlFor={inputId} className={labelClassName || "mb-1.5 block text-sm font-semibold"}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          className={`w-full rounded-xl border border-border px-3.5 py-2.5 pr-11 focus:border-primary focus:outline-none ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-fg transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {hint}
    </div>
  );
});

export default PasswordInput;
