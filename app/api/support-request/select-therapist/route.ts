import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Phase 142 — called the moment a client opens either booking path
// (diary-link or native, via BookSessionButton's onFirstInteract) for a
// therapist on the AI Support results screen. Records the selection on the
// client's support_requests row — deliberately never including the client's
// feelings_text (see EXECUTION_PLAN.md Phase 142 + this table's column
// comment). The actual scheduling itself still goes through the same
// diary-scheduling / intake-booking routes every other entry point on the
// site uses — this route only records that a selection happened.
//
// Phase 143 — the wizard's old "Your Info" step was removed; contact
// details are now collected on the Matches step itself and only exist at
// this exact moment (this is the first time this route sees them — the
// support_requests row has none saved yet), so this route also saves
// full_name/email/phone/consent_at here alongside the selection, instead of
// reading them back from a row that was never given them earlier.
//
// Phase 235 — Roy required that opening a form/modal must never send a
// notification/email on its own, only a genuinely completed submission may.
// This route fires on the "Choose therapist"/"Choose a date and time" BUTTON
// CLICK itself (BookSessionButton's onFirstInteract runs before its modal
// even opens — see that component's own comment), not on any completed
// booking. It used to also email the therapist ("New client match") and the
// internal team ("AI Support: therapist selected") from right here — a real,
// live email fired the instant a client merely clicked toward a therapist's
// card, before the intake form, before a slot was picked, before
// /api/diary-appointment/confirm (or /api/intake-booking for the native
// flow) ever ran. Worse, since Phase 147 removed StepMatches.tsx's old
// contact-details card, fullName/email/phone/agreedConsent have been blank/
// false on every real call for a long time — so this was sending a "client
// selected you" email to real therapists with no client contact info in it
// at all. Both email sends are removed. The genuine, complete booking
// confirmation email to the therapist ("A client confirmed a session with
// you") and to the internal team already exists and already fires correctly
// — only after real completion — from /api/diary-appointment/confirm
// (native session_bookings sends its own equivalent from
// /api/intake-booking). The support_requests status write below is left in
// place: it updates a row that was already genuinely submitted earlier in
// the wizard (never creates a new row here), so it isn't the kind of
// premature-record creation this phase targets — it's just a same-row status
// label an admin can see, not an outbound notification to anyone.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const supportRequestId = body?.supportRequestId as string | undefined;
  const therapistId = body?.therapistId as string | undefined;
  const fullName = (body?.fullName as string | undefined)?.trim() || null;
  const email = (body?.email as string | undefined)?.trim() || null;
  const phone = (body?.phone as string | undefined)?.trim() || null;
  const agreedConsent = body?.agreedConsent === true;

  if (!therapistId) {
    return NextResponse.json({ error: "therapistId is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  if (supportRequestId) {
    await adminSupabase
      .from("support_requests")
      .update({
        selected_therapist_id: therapistId,
        status: "therapist_selected",
        full_name: fullName,
        email,
        phone,
        consent_at: agreedConsent ? new Date().toISOString() : null,
      })
      .eq("id", supportRequestId);
  }

  return NextResponse.json({ ok: true });
}
