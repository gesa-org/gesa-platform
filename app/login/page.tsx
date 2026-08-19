"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#8c9eae]">
          <Logo size={32} />
          GESA
        </Link>
        <h1 className="mb-1 text-2xl">Sign in</h1>
        <p className="mb-6 text-sm text-muted-fg">Access your sessions, chat, and profile.</p>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            const data = new FormData(e.currentTarget);
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: String(data.get("email") ?? ""),
              password: String(data.get("password") ?? ""),
            });
            setPending(false);
            if (signInError) {
              setError(signInError.message);
              return;
            }
            // Read `next` directly from the URL rather than via useSearchParams(),
            // which would force this page out of static rendering (Next 14
            // requires a Suspense boundary around that hook).
            const next = new URLSearchParams(window.location.search).get("next");
            router.push(next || "/");
            router.refresh();
          }}
        >
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
              className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" block>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-fg">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-fg">
          Looking for support instead?{" "}
          <Link href="/intake" className="font-semibold text-primary">
            Start here
          </Link>
        </p>
      </div>
    </section>
  );
}
