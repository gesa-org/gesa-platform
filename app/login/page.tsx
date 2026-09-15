import Link from "next/link";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import SignInForm from "@/components/auth/SignInForm";

// Phase 214 — the actual sign-in form (fields, submit handler, and the new
// guardian-consent gate) moved into components/auth/SignInForm.tsx so the
// same logic is shared with the new tabbed /account-access page (which the
// footer's "Sign In / Create Account" link opens — see Footer.tsx and
// AuthStatus.tsx's own Phase 214 comments). This page is now a thin wrapper
// around that shared component; nothing about the route, its URL, or its
// behavior changed.
export default function LoginPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <h1 className="mb-1 text-2xl">Sign in</h1>
        <p className="mb-6 text-sm text-muted-fg">Access your sessions, chat, and profile.</p>
        <SignInForm />
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
