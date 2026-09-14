import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { capturePayPalOrder } from "@/lib/payments/paypal";

// Phase 196 — Professional Services checkout, step 2. Called by
// PaymentModal's PayPal Buttons `onApprove` handler once the client
// approves payment on PayPal's own UI. Captures the order server-side (the
// only place that actually moves money) and records the result — this route
// never marks a booking "confirmed" itself; /api/diary-appointment/confirm
// still owns that (and now requires payment_status "paid" for any
// professional-service booking before it will do so), so a client can't
// skip straight to a confirmed booking by calling this route alone.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const eventId = body?.eventId as string | undefined;
  const orderId = body?.orderId as string | undefined;
  if (!eventId || !orderId) {
    return NextResponse.json({ error: "eventId and orderId are required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: event } = await adminSupabase
    .from("diary_scheduling_events")
    .select("id, service_type, payment_status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.service_type !== "professional") {
    return NextResponse.json({ error: "We couldn't find that booking — please start again." }, { status: 404 });
  }
  if (event.payment_status === "paid") {
    // Idempotent — a double-fired onApprove (network retry, double click)
    // shouldn't fail or attempt a second capture.
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  let capture;
  try {
    capture = await capturePayPalOrder(orderId);
  } catch {
    await adminSupabase.from("diary_scheduling_events").update({ payment_status: "failed" }).eq("id", eventId);
    return NextResponse.json({ error: "Payment could not be completed — please try again." }, { status: 502 });
  }

  if (capture.referenceId && capture.referenceId !== eventId) {
    // Defense in depth — this order's custom_id should always match the
    // booking that created it. A mismatch means something is wrong enough
    // that this capture should not be trusted to confirm anything.
    return NextResponse.json({ error: "Payment could not be verified for this booking." }, { status: 409 });
  }

  if (capture.status !== "COMPLETED") {
    await adminSupabase.from("diary_scheduling_events").update({ payment_status: "failed" }).eq("id", eventId);
    return NextResponse.json(
      { error: "Payment was not successful — please try again or use a different payment method." },
      { status: 402 }
    );
  }

  await adminSupabase
    .from("diary_scheduling_events")
    .update({ payment_status: "paid", payment_reference: capture.captureId })
    .eq("id", eventId);

  return NextResponse.json({ ok: true });
}
