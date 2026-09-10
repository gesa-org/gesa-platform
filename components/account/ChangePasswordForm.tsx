"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordRequirements from "@/components/ui/PasswordRequirements";
import { createClient } from "@/lib/supabase/client";
import { evaluatePassword } from "@/lib/auth/passwordPolicy";
import { friendlyChangePasswordError } from "@/lib/auth/authErrors";

// Phase 175 — new "Change Password" section for Account Settings
// (app/account/page.tsx), per Roy's spec ("Change Password area in Account
// Settings, if available" — this page is that area; there was previously no
// way to change a password except the forgot-password flow). Same shared
// PasswordInput/PasswordRequirements/passwordPolicy/authErrors this phase
// built for Sign Up and Reset Password, so behavior (toggle, strength
// policy, friendly errors) is identical everywhere a password is chosen.
//
// Unlike Reset Password, this runs from an already-authenticated normal
// session (not a recovery session) — `supabase.auth.updateUser({ password })`
// works the same way regardless, no separate API needed. Also revokes every
// *other* active session via `signOut({ scope: "others" })` on success, same
// reasoning as the reset-password page: a password change should end any
// other session using the old credentials, not just leave them running.
export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  return (
    <form
      className="mt-6 rounded-[var(--radius)] border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setError(null);
        setStatus("idle");
        const data = new FormData(form);
        const passwordValue = String(data.get("new_password") ?? "");
        const confirmPassword = String(data.get("confirm_new_password") ?? "");
        if (passwordValue !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        const { passed } = evaluatePassword(passwordValue);
        if (!passed) {
          setError("Choose a stronger password that meets the requirements below.");
          return;
        }
        setPending(true);
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({ password: passwordValue });
        if (updateError) {
          setPending(false);
          setError(friendlyChangePasswordError(updateError));
          return;
        }
        await supabase.auth.signOut({ scope: "others" }).catch(() => {});
        setPending(false);
        setStatus("saved");
        setNewPassword("");
        form.reset();
      }}
    >
      <h2 className="mb-1 text-lg font-semibold">Change password</h2>
      <p className="mb-4 text-[13.5px] text-muted-fg">
        Choose a new password for your account. You&apos;ll stay signed in here; any other signed-in device will be
        signed out.
      </p>
      <div className="flex flex-col gap-3.5">
        <PasswordInput
          id="account-new-password"
          name="new_password"
          label="New password"
          required
          minLength={12}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint={<PasswordRequirements password={newPassword} />}
        />
        <PasswordInput id="account-confirm-new-password" name="confirm_new_password" label="Confirm new password" required minLength={12} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
          {status === "saved" && <span className="text-[13.5px] font-medium text-primary">Password updated.</span>}
        </div>
      </div>
    </form>
  );
}
