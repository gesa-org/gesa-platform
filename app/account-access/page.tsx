"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import SignInForm from "@/components/auth/SignInForm";
import CreateAccountForm from "@/components/auth/CreateAccountForm";

// Phase 214 — the dedicated authentication screen the footer's new
// "Sign In / Create Account" link opens (see Footer.tsx), per the request's
// "two clear options/tabs: Sign In / Create Account." Both tabs render the
// exact same shared components the standalone /login and /signup routes
// use (SignInForm / CreateAccountForm) — no duplicated logic, and those two
// routes are left in place unchanged for anyone with an existing bookmark
// or direct link to either.
export default function AccountAccessPage() {
  const [tab, setTab] = useState<"signin" | "create">("signin");

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>

        <div role="tablist" aria-label="Sign in or create an account" className="mb-6 flex gap-1.5 rounded-full bg-secondary p-1">
          <button
            type="button"
            role="tab"
            id="account-access-tab-signin"
            aria-selected={tab === "signin"}
            aria-controls="account-access-panel-signin"
            onClick={() => setTab("signin")}
            className={`flex-1 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              tab === "signin" ? "bg-card text-foreground shadow-soft" : "text-muted-fg hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            id="account-access-tab-create"
            aria-selected={tab === "create"}
            aria-controls="account-access-panel-create"
            onClick={() => setTab("create")}
            className={`flex-1 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${
              tab === "create" ? "bg-card text-foreground shadow-soft" : "text-muted-fg hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {tab === "signin" ? (
          <div role="tabpanel" id="account-access-panel-signin" aria-labelledby="account-access-tab-signin">
            <h1 className="mb-1 text-2xl">Sign in</h1>
            <p className="mb-6 text-sm text-muted-fg">Access your sessions, chat, and profile.</p>
            <SignInForm />
          </div>
        ) : (
          <div role="tabpanel" id="account-access-panel-create" aria-labelledby="account-access-tab-create">
            <h1 className="mb-1 text-2xl">Create your account</h1>
            <p className="mb-6 text-sm text-muted-fg">
              Free, confidential mental-health support — for GESA clients tracking sessions and chat.
            </p>
            <CreateAccountForm />
          </div>
        )}
      </div>
    </section>
  );
}
