import { NextResponse } from "next/server";
import { SequenceType } from "@mollie/api-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMollieClient, mollieConfigured } from "@/lib/mollie";

// Phase 99 — replaces the plain "insert and say thanks" flow from Phase 98
// with a real payment. DonateForm.tsx posts here once the donor confirms
// their gift details; this route creates the `donations` row (status
// "open"), asks Mollie for a real payment/checkout session, records the
// resulting Mollie payment id on that row, and returns the checkout URL for
// the browser to redirect to. The row exists *before* the donor ever
// reaches Mollie so a payment that's abandoned or fails still leaves a
// record an admin can see and follow up on, not silence.
//
// "Give monthly" needs a Mollie Customer + a `sequenceType: "first"`
// payment (Mollie's recurring-payments flow — see
// https://docs.mollie.com/docs/recurring-payments) so the payment carries a
// reusable mandate. The actual recurring Subscription is created once that
// first payment clears (app/api/webhooks/mollie/route.ts) — Mollie doesn't
// support creating a subscription before its first payment is confirmed.
export async function POST(request: Request) {
  if (!mollieConfigured) {
    return NextResponse.json(
      { error: "Donations aren't connected to a payment processor yet. Please try again later or contact us directly." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const fullName = (body?.fullName as string | undefined)?.trim() ?? "";
  const email = (body?.email as string | undefined)?.trim() ?? "";
  const phone = (body?.phone as string | undefined)?.trim() || null;
  const frequency = body?.frequency === "monthly" ? "monthly" : "once";
  const amount = Number(body?.amount);
  const amountChoice = (body?.amountChoice as string | undefined) ?? null;
  const message = (body?.message as string | undefined)?.trim() || null;

  if (!fullName || !email || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Missing or invalid donor details." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const amountValue = amount.toFixed(2);
  const supabase = createAdminClient();

  const { data: donation, error: insertError } = await supabase
    .from("donations")
    .insert({
      full_name: fullName,
      email,
      phone,
      frequency,
      amount,
      amount_choice: amountChoice,
      message,
      status: "open",
      currency: "EUR",
    })
    .select("id")
    .single();

  if (insertError || !donation) {
    return NextResponse.json({ error: "Could not start your donation. Please try again." }, { status: 500 });
  }

  const mollie = getMollieClient();
  const redirectUrl = `${siteUrl}/donate/thank-you?donation=${donation.id}`;
  const webhookUrl = `${siteUrl}/api/webhooks/mollie`;
  const description = frequency === "monthly" ? `GESA monthly gift — €${amountValue}/mo` : `GESA one-time gift — €${amountValue}`;

  try {
    if (frequency === "monthly") {
      const customer = await mollie.customers.create({ name: fullName, email, metadata: { donationId: donation.id } });
      const payment = await mollie.payments.create({
        amount: { value: amountValue, currency: "EUR" },
        description,
        redirectUrl,
        webhookUrl,
        customerId: customer.id,
        sequenceType: SequenceType.first,
        metadata: { donationId: donation.id },
      });
      await supabase
        .from("donations")
        .update({ status: "pending", mollie_payment_id: payment.id, mollie_customer_id: customer.id })
        .eq("id", donation.id);
      return NextResponse.json({ checkoutUrl: payment.getCheckoutUrl() });
    }

    const payment = await mollie.payments.create({
      amount: { value: amountValue, currency: "EUR" },
      description,
      redirectUrl,
      webhookUrl,
      metadata: { donationId: donation.id },
    });
    await supabase.from("donations").update({ status: "pending", mollie_payment_id: payment.id }).eq("id", donation.id);
    return NextResponse.json({ checkoutUrl: payment.getCheckoutUrl() });
  } catch {
    // The donation row already exists with status "open" even though Mollie
    // failed — visible in the CRM for manual follow-up rather than lost.
    return NextResponse.json({ error: "Could not start checkout with our payment provider. Please try again." }, { status: 502 });
  }
}
