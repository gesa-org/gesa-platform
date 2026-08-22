"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

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
          GESA
        </Link>
        <h1 className="mb-1 text-2xl">Create your account</h1>
        <p className="mb-6 text-sm text-muted-fg">
          For clients tracking sessions and chat. Therapists apply via{" "}
          <Link href="/contact?subject=Volunteer" className="font-semibold text-primary">
            volunteer application
          </Link>
          .
        </p>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            const data = new FormData(e.currentTarget);
            const email = String(data.get("email") ?? "");
            const fullName = String(data.get("full_name") ?? "");
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password: String(data.get("password") ?? ""),
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
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" block>
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
