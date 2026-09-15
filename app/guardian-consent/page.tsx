import Link from "next/link";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import { validateGuardianConsentToken } from "@/lib/guardianConsent";
import { GESA_PUBLIC_CONTACT_MAILTO } from "@/lib/contact";
import GuardianConsentForm from "@/components/auth/GuardianConsentForm";

export const dynamic = "force-dynamic";

const REASON_COPY: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "This consent link isn't valid",
    body: "We couldn't find a guardian-consent request matching this link. It may have been mistyped, or it may no longer exist.",
  },
  expired: {
    title: "This consent link has expired",
    body: "Guardian-consent links are only valid for a limited time. Ask the young person to sign up again so a new one can be sent.",
  },
  revoked: {
    title: "This consent request was withdrawn",
    body: "This request is no longer active. If you believe this is a mistake, please contact us.",
  },
  confirmed: {
    title: "Consent was already confirmed",
    body: "This link has already been used to confirm guardian consent, and the account is active. If that wasn't you, please contact us right away.",
  },
};

// Phase 214 — the public landing page for every guardian-consent email's
// "Review and confirm consent" link, mirroring app/accept-invitation/
// page.tsx's own structure: a Server Component validates the token (via
// the service-role client) before anything renders, so an
// invalid/expired/already-used link never reaches the real consent form.
export default async function GuardianConsentPage({ searchParams }: { searchParams?: { token?: string } }) {
  const token = searchParams?.token;

  if (!token) {
    return (
      <InvalidState
        title="Missing consent link"
        body="This page needs a guardian-consent link to work — please use the link from the email you received."
      />
    );
  }

  const result = await validateGuardianConsentToken(token);
  if (!result.ok) {
    const copy = REASON_COPY[result.reason] ?? REASON_COPY.not_found;
    return <InvalidState title={copy.title} body={copy.body} />;
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[460px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <GuardianConsentForm token={token} minorName={result.profile.full_name} />
      </div>
    </section>
  );
}

function InvalidState({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px] rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-soft">
        <Link href="/" className="mx-auto mb-6 flex w-fit items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <h1 className="mb-2 text-2xl">{title}</h1>
        <p className="mb-6 text-muted-fg">{body}</p>
        <a href={GESA_PUBLIC_CONTACT_MAILTO} className="font-semibold text-primary">
          Contact GESA support
        </a>
      </div>
    </section>
  );
}
