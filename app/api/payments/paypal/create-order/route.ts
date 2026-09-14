import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/payments/paypal";

// Phase 196 — Professional Services checkout, step 1. Called right after
// the client reviews their appointment on ScheduleReviewModal and chooses
// to proceed to payment (see components/booking/PaymentModal.tsx). Reads
// the therapist's price server-side (never trusts a client-submitted
// amount) and creates a PayPal order for exactly that amount, tagged with
// this booking's diary_scheduling_events.id as PayPal's `custom_id` so the
// capture step can verify what it's confirming.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const eventId = body?.eventId as string | undefined;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: "Online payment isn't configured yet — please contact GESA support." },
      { status: 500 }
    );
  }

  const adminSupabase = createAdminClient();
  const { data: event, error: eventError } = await adminSupabase
    .from("diary_scheduling_events")
    .select("id, therapist_id, status, service_type, selected_date, selected_start_time")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "We couldn't find that booking — please start again." }, { status: 404 });
  }
  if (event.service_type !== "professional") {
    return NextResponse.json({ error: "This booking doesn't require payment." }, { status: 400 });
  }
  if (!event.selected_date || !event.selected_start_time) {
    return NextResponse.json({ error: "Please select a date and time before checking out." }, { status: 400 });
  }
  if (event.status === "confirmed") {
    return NextResponse.json({ error: "This booking is already confirmed." }, { status: 409 });
  }

  const { data: therapist } = await adminSupabase
    .from("therapists")
    .select("full_name, session_price_amount, session_price_currency")
    .eq("id", event.therapist_id)
    .maybeSingle();

  if (!therapist || therapist.session_price_amount === null || therapist.session_price_amount === undefined) {
    return NextResponse.json(
      {
        error:
          "This professional has not yet configured a session price. Please choose another professional or contact GESA support.",
      },
      { status: 422 }
    );
  }

  const amount = Number(therapist.session_price_amount);
  const currency = therapist.session_price_currency || "USD";

  let order;
  try {
    order = await createPayPalOrder({
      amount,
      currency,
      referenceId: eventId,
      description: `GESA session with ${therapist.full_name}`,
    });
  } catch {
    return NextResponse.json({ error: "Could not start checkout with PayPal — please try again." }, { status: 502 });
  }

  await adminSupabase
    .from("diary_scheduling_events")
    .update({
      status: "payment_pending",
      payment_status: "pending",
      payment_provider: "paypal",
      price_amount: amount,
      price_currency: currency,
    })
    .eq("id", eventId);

  return NextResponse.json({
    orderId: order.id,
    amount,
    currency,
    therapistName: therapist.full_name,
  });
}
