"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordRequirements from "@/components/ui/PasswordRequirements";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import VolunteerApplyButton from "@/components/volunteer/VolunteerApplyButton";
import { createClient } from "@/lib/supabase/client";
import { evaluatePassword } from "@/lib/auth/passwordPolicy";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  // Phase 175 — tracked in state purely to drive the live PasswordRequirements
  // checklist below the field as the visitor types; the actual submitted
  // value still comes from FormData on submit, same as every other field on
  // this form (this state isn't what gets sent to Supabase).
  const [password, setPassword] = useState("");

  if (done) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-soft">
          <h1 className="mb-2 text-2xl">Check your email</h1>
          <p className="text-muted-fg">
            We&apos;ve sent a confirmation link to finish setting up your account.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <h1 className="mb-1 text-2xl">Create your account</h1>
        <p className="mb-6 text-sm text-muted-fg">
          For clients tracking sessions and chat. Therapists apply via{" "}
          <VolunteerApplyButton className="font-semibold text-primary">volunteer application</VolunteerApplyButton>.
        </p>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const data = new FormData(e.currentTarget);
            const email = String(data.get("email") ?? "");
            const fullName = String(data.get("full_name") ?? "");
            const passwordValue = String(data.get("password") ?? "");
            const confirmPassword = String(data.get("confirm_password") ?? "");
            // Phase 175 — Roy's spec: "Confirm Password field... validate
            // that the password and confirmation match before account
            // creation." Checked client-side before ever calling Supabase,
            // same order-of-operations as the existing reset-password page.
            if (passwordValue !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }
            // Phase 175 — password-strength policy (lib/auth/passwordPolicy.ts):
            // 12+ characters, upper/lower/number/symbol, and a small
            // commonly-compromised-password backstop. Supabase's own default
            // policy is just a length minimum, so this is the actual
            // effective policy for new accounts.
            const { passed } = evaluatePassword(passwordValue);
            if (!passed) {
              setError("Choose a stronger password that meets the requirements below.");
              return;
            }
            setPending(true);
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: passwordValue,
              options: {
                data: { full_name: fullName, role: "client" },
              },
            });
            setPending(false);
            if (signUpError) {
              setError(signUpError.message);
              return;
            }
            setDone(true);
            fetch("/api/email/welcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, fullName }),
            }).catch(() => {});
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Full name</label>
            <input
              name="full_name"
              required
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <PasswordInput
            id="signup-password"
            name="password"
            label="Password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={<PasswordRequirements password={password} />}
          />
          {/* Phase 175 — new field per Roy's spec; previously this form had
              no confirmation field at all. Independent show/hide toggle
              from the one above (each PasswordInput owns its own state). */}
          <PasswordInput id="signup-confirm-password" name="confirm_password" label="Confirm password" required minLength={12} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} block>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-fg">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
