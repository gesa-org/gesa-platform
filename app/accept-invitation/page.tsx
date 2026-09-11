import Link from "next/link";
import Logo from "@/components/Logo";
import GesaWordmark from "@/components/GesaWordmark";
import { validateInvitationToken } from "@/lib/invitations";
import { GESA_PUBLIC_CONTACT_MAILTO } from "@/lib/contact";
import AcceptInvitationForm from "@/components/AcceptInvitationForm";

export const dynamic = "force-dynamic";

const REASON_COPY: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "This invitation link isn't valid",
    body: "We couldn't find an invitation matching this link. It may have been mistyped, or the invitation may no longer exist.",
  },
  expired: {
    title: "This invitation has expired",
    body: "Invitation links are only valid for a limited time. Ask whoever invited you to send a new one.",
  },
  revoked: {
    title: "This invitation was revoked",
    body: "This invitation is no longer active. If you still need access, ask whoever invited you to send a new one.",
  },
  accepted: {
    title: "This invitation was already used",
    body: "This invitation has already been accepted and used to set up an account. If that wasn't you, please contact us right away.",
  },
  invalid_status: {
    title: "This invitation link isn't valid",
    body: "This invitation can't be accepted in its current state. Ask whoever invited you to send a new one.",
  },
};

// Phase 187 — the public landing page for every invitation email's
// "Create your account" link. A Server Component so token validation
// (lib/invitations.ts's validateInvitationToken, via the service-role
// client) happens before anything renders — an invalid/expired/revoked/
// already-used token never even reaches the account-setup form, matching
// the spec's "Display an invalid/expired/revoked page if validation
// fails."
export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token;

  if (!token) {
    return <InvalidState title="Missing invitation link" body="This page needs an invitation link to work — please use the link from your invitation email." />;
  }

  const result = await validateInvitationToken(token);
  if (!result.ok) {
    const copy = REASON_COPY[result.reason] ?? REASON_COPY.invalid_status;
    return <InvalidState title={copy.title} body={copy.body} />;
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px] rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft">
        <Link href="/" className="mb-6 flex items-center gap-2.5 font-sans text-[17px] font-medium tracking-[0.25em] text-[#5c6470]">
          <Logo size={32} />
          <GesaWordmark />
        </Link>
        <h1 className="mb-1 text-2xl">
          {result.invitation.invited_role === "therapist" ? "Set up your Professional account" : "Set up your Admin account"}
        </h1>
        <p className="mb-6 text-sm text-muted-fg">
          You&apos;ve been invited to join GESA as{" "}
          {result.invitation.invited_role === "therapist"
            ? "a Professional"
            : result.invitation.invited_role === "super_admin"
              ? "a Super Admin"
              : "an Administrator"}
          . Confirm your name and choose a password to finish setting up your account.
        </p>
        <AcceptInvitationForm
          token={token}
          email={result.invitation.email}
          invitedRole={result.invitation.invited_role}
          defaultFullName={[result.invitation.first_name, result.invitation.last_name].filter(Boolean).join(" ")}
        />
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
