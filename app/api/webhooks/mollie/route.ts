import { NextResponse } from "next/server";
import { PaymentStatus } from "@mollie/api-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMollieClient, mollieConfigured } from "@/lib/mollie";

// Phase 99 — Mollie's webhook contract is deliberately minimal and
// deliberately untrusted: it POSTs a single form field, `id`, to the
// `webhookUrl` given at payment creation, with no payload to trust and no
// signature to verify. The only safe way to know a payment's real status is
// to call back into Mollie's own API with that id — which is exactly what
// this route does — never trust a status if one were ever included in the
// POST body itself. See https://docs.mollie.com/reference/webhooks.
//
// For a "monthly" donation, the very first payment is created with
// `sequenceType: "first"` (see create-payment/route.ts) purely to obtain a
// reusable mandate — it does not itself set up recurring billing. Once that
// first payment clears, this route creates the actual recurring
// Subscription using the mandate Mollie attached to it. Every later
// recurring charge is fully automatic on Mollie's side from that point on;
// this webhook only needs to react to status changes on payments, not
// subscription-cycle events, for that ongoing billing to keep working.
export async function POST(request: Request) {
  if (!mollieConfigured) {
    return NextResponse.json({ error: "Mollie not configured" }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const paymentId = form?.get("id");
  if (typeof paymentId !== "string" || !paymentId) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const mollie = getMollieClient();
  const payment = await mollie.payments.get(paymentId).catch(() => null);
  if (!payment) {
    // Mollie sometimes pings a webhook for a payment that's since been
    // deleted (e.g. an abandoned test payment) — acknowledge with 200 so
    // Mollie doesn't keep retrying a payment that will never resolve.
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  const { data: donation } = await supabase
    .from("donations")
    .select("*")
    .eq("mollie_payment_id", payment.id)
    .maybeSingle();
  if (!donation) {
    return NextResponse.json({ ok: true });
  }

  const wasAlreadyPaid = donation.status === "paid";
  await supabase
    .from("donations")
    .update({ status: payment.status, paid_at: payment.status === PaymentStatus.paid ? new Date().toISOString() : donation.paid_at })
    .eq("id", donation.id);

  if (payment.status !== PaymentStatus.paid || wasAlreadyPaid) {
    return NextResponse.json({ ok: true });
  }

  // First-payment-just-cleared side effects, run once per donation.
  if (donation.frequency === "monthly" && donation.mollie_customer_id && payment.mandateId && !donation.mollie_subscription_id) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    try {
      const subscription = await mollie.customerSubscriptions.create({
        customerId: donation.mollie_customer_id,
        mandateId: payment.mandateId,
        amount: { value: Number(donation.amount).toFixed(2), currency: donation.currency },
        interval: "1 month",
        description: `GESA monthly gift — €${Number(donation.amount).toFixed(2)}/mo`,
        webhookUrl: `${siteUrl}/api/webhooks/mollie`,
      });
      await supabase.from("donations").update({ mollie_subscription_id: subscription.id }).eq("id", donation.id);
    } catch {
      // The first payment is already recorded as paid regardless — a
      // failure here only means the recurring subscription needs to be set
      // up by hand in the Mollie dashboard, not that the donor's payment is
      // lost.
    }
  }

  // Best-effort confirmation/notification emails, via the same shared route
  // DonateForm used to call directly pre-Phase-99. Awaited (not
  // fire-and-forget) — unlike a page request, nothing is waiting on this
  // response, and a serverless function can be torn down right after it
  // returns, which would silently cancel an un-awaited fetch. The payment
  // is already recorded as paid in the database above regardless of whether
  // this succeeds.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await fetch(`${siteUrl}/api/email/donation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: donation.full_name,
      email: donation.email,
      phone: donation.phone,
      frequency: donation.frequency,
      amount: Number(donation.amount),
      amountChoice: donation.amount_choice,
      message: donation.message,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
