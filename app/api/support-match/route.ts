import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchTherapists } from "@/lib/ai/matchTherapists";
import type { GenderPreference, SessionFormat } from "@/lib/database.types";

// Phase 142 — the AI Support wizard's matching endpoint, replacing
// /api/match (kept in place, unused by this flow) as the write target for
// the new unified support_requests table. Two things happen in one request:
// 1) the client's preferences + feelings text (collected across the first 3
//    wizard steps) are saved onto their support_requests row for the first
//    time — earlier steps only hold state in the browser, matching this
//    app's existing "only write when there's something real to save"
//    pattern.
// 2) the actual match runs, same roster/matching logic as /api/match.
//
// Phase 143 — symptoms/availabilityNotes/accessibilityNeeds and the
// contact-details fields (fullName/email/phone/ageConfirmed/agreedConsent)
// no longer arrive here at all: the "Support Needs" and "Your Info" steps
// that used to collect them were removed from the wizard entirely.
// Contact details are now collected later, on the Matches step itself, and
// saved by /api/support-request/select-therapist instead — the only point
// in the new flow where they actually exist.
const GENDER_VALUES: GenderPreference[] = ["woman", "man", "nonbinary", "no_preference"];
const FORMAT_VALUES: SessionFormat[] = ["online", "call", "in_person"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const supportRequestId = body?.supportRequestId as string | undefined;
  const answers = body?.answers as Record<string, unknown> | undefined;

  if (!answers) {
    return NextResponse.json({ error: "answers are required" }, { status: 400 });
  }

  const treatmentType = (answers.treatmentType as string | undefined) || null;
  const genderPreferenceRaw = (answers.genderPreference as string | undefined) ?? "no_preference";
  const genderPreference: GenderPreference = GENDER_VALUES.includes(genderPreferenceRaw as GenderPreference)
    ? (genderPreferenceRaw as GenderPreference)
    : "no_preference";
  const preferredLanguage = (answers.preferredLanguage as string | undefined) || null;
  const sessionFormatRaw = answers.sessionFormat as string | undefined;
  const sessionFormat = sessionFormatRaw && FORMAT_VALUES.includes(sessionFormatRaw as SessionFormat) ? (sessionFormatRaw as SessionFormat) : null;
  const clinicLocationId = (answers.clinicLocationId as string | undefined) || null;
  const feelingsText = (answers.feelingsText as string | undefined) || null;

  const supabase = await createClient();
  const { data: baseTherapists, error } = await supabase
    .from("therapists")
    .select(
      "id, full_name, slug, photo_url, specialties, short_summary, bio, languages, gender, years_experience, is_verified, credentials, session_lengths, time_zone, tracks, diary_link, diary_link_status, country, price_note, created_at, updated_at"
    )
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: "could not load therapists" }, { status: 500 });
  }

  const adminSupabase = createAdminClient();

  if (supportRequestId) {
    await adminSupabase
      .from("support_requests")
      .update({
        status: "preferences_submitted",
        treatment_type: treatmentType,
        gender_preference: genderPreference,
        preferred_language: preferredLanguage,
        session_format: sessionFormat,
        clinic_location_id: sessionFormat === "in_person" ? clinicLocationId : null,
        feelings_text: feelingsText,
        crisis_disclaimer_shown_at: new Date().toISOString(),
      })
      .eq("id", supportRequestId);
  }

  if (!baseTherapists || baseTherapists.length === 0) {
    if (supportRequestId) {
      await adminSupabase.from("support_requests").update({ status: "no_match" }).eq("id", supportRequestId);
    }
    return NextResponse.json({ matches: [] });
  }

  // Same reasoning as /api/match: has_whatsapp is a derived boolean from a
  // service-role-only lookup, contact_phone itself is never sent to the
  // browser here.
  const { data: phoneRows } = await adminSupabase
    .from("therapists")
    .select("id, contact_phone")
    .in(
      "id",
      baseTherapists.map((t) => t.id)
    );
  const hasWhatsappById = new Map((phoneRows ?? []).map((r) => [r.id, Boolean(r.contact_phone)]));
  const therapists = baseTherapists.map((t) => ({ ...t, has_whatsapp: hasWhatsappById.get(t.id) ?? false }));

  const { matches: results, genderPreferenceHonored } = await matchTherapists(
    { treatmentType, genderPreference, preferredLanguage, feelingsText },
    therapists
  );

  const matches = results
    .map((r) => {
      const therapist = therapists.find((t) => t.id === r.therapistId);
      if (!therapist) return null;
      return { therapist, reasoning: r.reasoning };
    })
    .filter((m): m is { therapist: (typeof therapists)[number]; reasoning: string } => m !== null);

  if (supportRequestId) {
    await adminSupabase
      .from("support_requests")
      .update({
        status: matches.length > 0 ? "matched" : "no_match",
        matched_therapist_ids: matches.map((m) => m.therapist.id),
        ai_reasoning: Object.fromEntries(matches.map((m) => [m.therapist.id, m.reasoning])),
        gender_preference_honored: genderPreferenceHonored,
      })
      .eq("id", supportRequestId);
  }

  return NextResponse.json({ matches, genderPreferenceHonored });
}
