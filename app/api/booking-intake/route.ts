import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ParticipatedBefore, ServiceType, SessionsCount } from "@/lib/database.types";

const PARTICIPATED_VALUES: ParticipatedBefore[] = ["yes", "no"];
const SESSIONS_COUNT_VALUES: SessionsCount[] = ["1", "2", "3", "4", "5", "6", "over_6"];
const SERVICE_TYPE_VALUES: ServiceType[] = ["charity", "professional"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = CURRENT_YEAR - 100;
const MAX_BIRTH_YEAR_FOR_18 = CURRENT_YEAR - 18;

// Phase 196 — the free-session cap for Charity Services. Checked here (not
// only client-side) since this is the one server route that can't be
// bypassed by calling the API directly.
const CHARITY_SESSION_LIMIT = 6;

// Phase 128 — the "Before you book your session" intake step required
// ahead of a diary-link scheduler handoff (see components/booking/
// BookingIntakeModal.tsx and components/therapists/BookSessionButton.tsx).
//
// Writes always go through the service-role admin client, never the
// cookie-based client — this table has no public INSERT/UPDATE RLS policy
// at all by design (see the create_booking_intake_forms migration), a
// stricter posture than session_bookings/match_requests/
// diary_scheduling_events specifically because of how much personal data
// this one form collects in a single row (city, birth year, phone,
// participation history) on top of two consent timestamps. This route is
// the only path allowed to write here.
//
// Idempotency: the client generates and persists (in sessionStorage, keyed
// per therapist) an opaque `idempotencyKey` the first time this modal opens
// for a given therapist, and resends the same key on every submit attempt
// for that therapist in that browser session — including a resubmit after
// fixing a validation error, or reopening the modal after closing it
// without finishing. Upserting on that column means retries never create a
// second row; they just refresh the one row with whatever was last typed.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const therapistId = body?.therapistId as string | undefined;
  const therapistName = (body?.therapistName as string | undefined)?.trim();
  const clientName = (body?.clientName as string | undefined)?.trim();
  const clientEmail = (body?.clientEmail as string | undefined)?.trim();
  const clientPhone = (body?.clientPhone as string | undefined)?.trim();
  const clientCity = (body?.clientCity as string | undefined)?.trim();
  const clientBirthYear = body?.clientBirthYear as number | undefined;
  const participatedBefore = body?.participatedBefore as string | undefined;
  const sessionsCount = body?.sessionsCount as string | undefined;
  const agreedTerms = body?.agreedTerms === true;
  const agreedPrivacy = body?.agreedPrivacy === true;
  const idempotencyKey = (body?.idempotencyKey as string | undefined)?.trim();
  // Phase 196 — only ever present for the Community page's two new entry
  // points; undefined/null for every other caller of this route, which then
  // behaves exactly as it did before this phase.
  const serviceTypeRaw = body?.serviceType as string | undefined;
  if (serviceTypeRaw && !SERVICE_TYPE_VALUES.includes(serviceTypeRaw as ServiceType)) {
    return NextResponse.json({ error: "invalid serviceType" }, { status: 400 });
  }
  const serviceType = (serviceTypeRaw as ServiceType | undefined) ?? null;

  if (!therapistId || !therapistName || !idempotencyKey) {
    return NextResponse.json({ error: "therapistId, therapistName, and idempotencyKey are required" }, { status: 400 });
  }
  if (!clientName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!clientEmail || !EMAIL_RE.test(clientEmail)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (!clientPhone || clientPhone.replace(/[^\d]/g, "").length < 7) {
    return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 });
  }
  if (!clientCity) {
    return NextResponse.json({ error: "City / address is required" }, { status: 400 });
  }
  if (
    !clientBirthYear ||
    !Number.isInteger(clientBirthYear) ||
    clientBirthYear < MIN_BIRTH_YEAR ||
    clientBirthYear > CURRENT_YEAR
  ) {
    return NextResponse.json({ error: "Please enter a valid year of birth" }, { status: 400 });
  }
  if (clientBirthYear > MAX_BIRTH_YEAR_FOR_18) {
    return NextResponse.json({ error: "You must be at least 18 years old to book a session" }, { status: 400 });
  }
  if (!participatedBefore || !PARTICIPATED_VALUES.includes(participatedBefore as ParticipatedBefore)) {
    return NextResponse.json({ error: "Please answer whether you participated in a meeting before" }, { status: 400 });
  }
  if (!sessionsCount || !SESSIONS_COUNT_VALUES.includes(sessionsCount as SessionsCount)) {
    return NextResponse.json({ error: "Please select how many sessions you've participated in" }, { status: 400 });
  }
  if (!agreedTerms || !agreedPrivacy) {
    return NextResponse.json({ error: "Please agree to the terms and conditions and the privacy policy to continue" }, { status: 400 });
  }

  // Who's asking, if anyone — this is the one read that still goes through
  // the normal cookie-based client, purely to identify the signed-in user
  // (if any) for `profile_id`. It never touches booking_intake_forms.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const consentTimestamp = new Date().toISOString();
  const adminSupabase = createAdminClient();

  // Phase 196 — Charity Services' 6-free-session cap. Counted by client
  // email against confirmed diary_scheduling_events rows tagged
  // service_type "charity" (there's no login required for this flow, so
  // email is the only identifier a guest booking reliably has — the same
  // identifier the confirmation/notification emails already key off of).
  // Checked here, before the intake is even saved, so an over-the-limit
  // client never reaches the calendar step at all.
  if (serviceType === "charity") {
    const { count, error: countError } = await adminSupabase
      .from("diary_scheduling_events")
      .select("id", { count: "exact", head: true })
      .eq("service_type", "charity")
      .eq("status", "confirmed")
      .eq("client_email", clientEmail);
    if (countError) {
      return NextResponse.json({ error: "Could not verify Charity Services eligibility — please try again." }, { status: 500 });
    }
    if ((count ?? 0) >= CHARITY_SESSION_LIMIT) {
      return NextResponse.json(
        {
          error:
            "You have reached the maximum of 6 free Charity Services sessions. Please discuss continued support and payment options directly with your professional.",
        },
        { status: 403 }
      );
    }
  }

  // Upsert on idempotency_key so a resubmit (fixed a typo, reopened the
  // modal, double-clicked) updates the one existing row instead of creating
  // a second one.
  const { data: existing } = await adminSupabase
    .from("booking_intake_forms")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  const record = {
    therapist_id: therapistId,
    therapist_name: therapistName,
    profile_id: user?.id ?? null,
    client_name: clientName,
    client_email: clientEmail,
    client_phone: clientPhone,
    client_city: clientCity,
    client_birth_year: clientBirthYear,
    participated_before: participatedBefore as ParticipatedBefore,
    sessions_count: sessionsCount as SessionsCount,
    agreed_terms_at: consentTimestamp,
    agreed_privacy_at: consentTimestamp,
    idempotency_key: idempotencyKey,
    service_type: serviceType,
  };

  const { data: saved, error } = existing
    ? await adminSupabase.from("booking_intake_forms").update(record).eq("id", existing.id).select("id").single()
    : await adminSupabase
        .from("booking_intake_forms")
        .insert({ ...record, status: "intake_completed" })
        .select("id")
        .single();

  if (error || !saved) {
    return NextResponse.json({ error: "Could not save your details — please try again." }, { status: 500 });
  }

  return NextResponse.json({ id: saved.id });
}
