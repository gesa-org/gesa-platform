import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchTherapists } from "@/lib/ai/matchTherapists";
import type { GenderPreference } from "@/lib/database.types";

// Phase 126 — this route used to select `contact_phone` directly into the
// therapist objects returned in the JSON response, so *every* visitor
// running the "Find Your Therapist" wizard received every matched
// therapist's raw phone number in the browser, regardless of whether they
// ever booked — a real, live instance of exactly the confidentiality leak
// Roy flagged (public API response exposing a confidential field). Fixed
// by never selecting contact_phone here at all; `has_whatsapp` (a boolean)
// is computed instead so the UI can still decide whether to offer a
// WhatsApp/call option. The actual number, if needed for a WhatsApp deep
// link, is only ever returned later — from /api/match-booking, and only
// after a real booking is created for that specific therapist (mirrors the
// same pattern used in /api/intake-booking).

const GENDER_VALUES: GenderPreference[] = ["woman", "man", "nonbinary", "no_preference"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const symptoms = Array.isArray(body?.symptoms) ? (body.symptoms as string[]).filter(Boolean) : [];
  const treatmentType = (body?.treatmentType as string | undefined) || null;
  const genderPreferenceRaw = (body?.genderPreference as string | undefined) ?? "no_preference";
  const genderPreference: GenderPreference = GENDER_VALUES.includes(genderPreferenceRaw as GenderPreference)
    ? (genderPreferenceRaw as GenderPreference)
    : "no_preference";

  const supabase = await createClient();
  const { data: baseTherapists, error } = await supabase
    .from("therapists")
    .select(
      "id, full_name, slug, photo_url, specialties, short_summary, bio, languages, gender, years_experience, is_verified"
    )
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: "could not load therapists" }, { status: 500 });
  }
  if (!baseTherapists || baseTherapists.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  // A separate, server-only lookup (service-role client, never exposed to
  // the browser) just to compute the has_whatsapp boolean — never the
  // number itself. Two queries instead of one join because the public
  // `anon` role can no longer select contact_phone at all; this is the
  // only piece of this route that needs elevated access.
  const adminSupabase = createAdminClient();
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
    { symptoms, treatmentType, genderPreference },
    therapists
  );

  const matches = results
    .map((r) => {
      const therapist = therapists.find((t) => t.id === r.therapistId);
      if (!therapist) return null;
      return { therapist, reasoning: r.reasoning };
    })
    .filter((m): m is { therapist: (typeof therapists)[number]; reasoning: string } => m !== null);

  return NextResponse.json({ matches, genderPreferenceHonored });
}
