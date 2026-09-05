import Link from "next/link";
import { HeartHandshake, Clock, XCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPageContent } from "@/lib/content";
import { DONATE_THANK_YOU_CONTENT_FALLBACK } from "@/app/donate/thank-you/thankYouContent";
import { resolveEditorPreview } from "@/lib/ui-builder/pageContentResolver";
import EditorPreviewBridge from "@/components/ui-builder/public/EditorPreviewBridge";
import EditableText from "@/components/ui-builder/public/EditableText";

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
export default async function DonateThankYouPage({
  searchParams,
}: {
  searchParams: { donation?: string; editorPreview?: string };
}) {
  const donationId = searchParams?.donation;
  let status: string | null = null;

  if (donationId) {
    const supabase = createAdminClient();
    const { data } = await supabase.from("donations").select("status, frequency, amount").eq("id", donationId).maybeSingle();
    status = data?.status ?? null;
  }

  const contentRaw = await getPageContent("page_donate_thank_you", DONATE_THANK_YOU_CONTENT_FALLBACK);
  const { resolved, isEditorPreview } = await resolveEditorPreview(
    "donate-thank-you",
    contentRaw as unknown as Record<string, unknown>,
    searchParams
  );
  const content = resolved as unknown as typeof contentRaw;

  const isPaid = status === "paid";
  const isFailedLike = status === "failed" || status === "canceled" || status === "expired";

  const page = (
    <section className="section">
      <div className="wrap max-w-[520px] text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-primary">
          {isFailedLike ? <XCircle size={26} /> : isPaid ? <HeartHandshake size={26} /> : <Clock size={26} />}
        </span>
        {isFailedLike ? (
          <>
            <h1 className="mb-2 font-serif text-[28px] font-semibold text-foreground">
              <EditableText contentId="donate-thank-you.failed.heading" label="Failed heading" value={content.failedHeading} as="span" />
            </h1>
            <div className="text-muted-fg">
              <EditableText contentId="donate-thank-you.failed.body" label="Failed body" value={content.failedBody} as="span" />
            </div>
          </>
        ) : isPaid ? (
          <>
            <h1 className="mb-2 font-serif text-[28px] font-semibold text-foreground">
              <EditableText contentId="donate-thank-you.paid.heading" label="Paid heading" value={content.paidHeading} as="span" />
            </h1>
            <div className="text-muted-fg">
              <EditableText contentId="donate-thank-you.paid.body" label="Paid body" value={content.paidBody} as="span" />
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-2 font-serif text-[28px] font-semibold text-foreground">
              <EditableText contentId="donate-thank-you.pending.heading" label="Pending heading" value={content.pendingHeading} as="span" />
            </h1>
            <div className="text-muted-fg">
              <EditableText contentId="donate-thank-you.pending.body" label="Pending body" value={content.pendingBody} as="span" />
            </div>
          </>
        )}
        <Link
          href="/"
          className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-primary-fg shadow-soft transition-all hover:-translate-y-px hover:bg-primary-600"
        >
          <EditableText contentId="donate-thank-you.backLinkLabel" label="Back link label" value={content.backLinkLabel} as="span" />
        </Link>
      </div>
    </section>
  );

  return isEditorPreview ? <EditorPreviewBridge>{page}</EditorPreviewBridge> : page;
}
