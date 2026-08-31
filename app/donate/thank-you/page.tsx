import Link from "next/link";
import { HeartHandshake, Clock, XCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Thank you — GESA",
};

export const dynamic = "force-dynamic";

// Phase 99 — Mollie redirects the donor back here after checkout
// (regardless of outcome — redirectUrl is not a "success only" URL in
// Mollie's flow). The row's real status only becomes final once Mollie's
// webhook has had a chance to run (app/api/webhooks/mollie/route.ts), which
// can land slightly after this redirect, so this reads whatever status is
// on the row right now rather than assuming "paid" just because the donor
// made it back to this page.
//
// Uses the service-role client (donations' RLS is admin/reviewer-read
// only, and a donor landing here has no session at all) scoped to the
// single row named by the opaque id Mollie's redirect carries — the same
// narrow, single-row lookup-by-token pattern any order confirmation page
// uses, not a general bypass of who can browse the donations list.
export default async function DonateThankYouPage({ searchParams }: { searchParams: { donation?: string } }) {
  const donationId = searchParams?.donation;
  let status: string | null = null;

  if (donationId) {
    const supabase = createAdminClient();
    const { data } = await supabase.from("donations").select("status, frequency, amount").eq("id", donationId).maybeSingle();
    status = data?.status ?? null;
  }

  const isPaid = status === "paid";
  const isFailedLike = status === "failed" || status === "canceled" || status === "expired";

  return (
    <section className="section">
      <div className="wrap max-w-[520px] text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-primary">
          {isFailedLike ? <XCircle size={26} /> : isPaid ? <HeartHandshake size={26} /> : <Clock size={26} />}
        </span>
        {isFailedLike ? (
          <>
            <h1 className="mb-2 font-serif text-[28px] font-semibold text-foreground">Your payment didn&apos;t go through</h1>
            <p className="text-muted-fg">
              No charge was made. If this wasn&apos;t intentional, you&apos;re welcome to try again — or reach out and
              we&apos;ll help directly.
            </p>
          </>
        ) : isPaid ? (
          <>
            <h1 className="mb-2 font-serif text-[28px] font-semibold text-foreground">Thank you for your gift</h1>
            <p className="text-muted-fg">
              Your payment has been confirmed. A receipt and confirmation email are on their way — your generosity
              helps gifted professional support reach more people, across borders.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 font-serif text-[28px] font-semibold text-foreground">Finishing up your gift</h1>
            <p className="text-muted-fg">
              We&apos;re confirming your payment with our payment provider — this only takes a moment. You&apos;ll
              receive a confirmation email as soon as it clears.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-primary-fg shadow-soft transition-all hover:-translate-y-px hover:bg-primary-600"
        >
          Back to GESA
        </Link>
      </div>
    </section>
  );
}
