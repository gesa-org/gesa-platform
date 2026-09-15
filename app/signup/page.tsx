import Link from "next/link";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import CreateAccountForm from "@/components/auth/CreateAccountForm";

// Phase 214 — rebuilt on top of the shared CreateAccountForm (first/last
// name, DOB + country, T&C/Privacy consent, and the under-18
// guardian-consent branch — see that component's own header comment for
// the full design). This page is now a thin wrapper, same pattern as
// app/login/page.tsx's own Phase 214 update, so the identical form also
// renders inside the new tabbed /account-access page.
export default function SignupPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <h1 className="mb-1 text-2xl">Create your account</h1>
        <p className="mb-6 text-sm text-muted-fg">
          Free, confidential mental-health support — for GESA clients tracking sessions and chat.
        </p>
        <CreateAccountForm />
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
