"use client";

import { Check, X } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/auth/passwordPolicy";

// Phase 175 — inline password-requirements checklist shown under a new-
// password field (Sign Up, Reset Password, Change Password). Purely
// visual guidance, not a form control — the actual pass/fail gate lives in
// the page's own submit handler (evaluatePassword), this just gives a
// visitor a live readout of which rule(s) are still unmet as they type.
// `aria-live="polite"` so a screen-reader user is told as items get
// checked off, without interrupting their typing the way "assertive" would.
export default function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul aria-live="polite" className="mt-2 flex flex-col gap-1 text-[12.5px]">
      {PASSWORD_RULES.map((rule) => {
        const met = password.length > 0 && rule.test(password);
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 ${met ? "text-accent" : "text-muted-fg"}`}>
            {met ? (
              <Check size={13} className="flex-none" aria-hidden="true" />
            ) : (
              <X size={13} className="flex-none opacity-40" aria-hidden="true" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
