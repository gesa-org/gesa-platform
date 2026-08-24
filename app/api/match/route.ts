import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchTherapists } from "@/lib/ai/matchTherapists";
import type { GenderPreference } from "@/lib/database.types";

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
  const { data: therapists, error } = await supabase
    .from("therapists")
    .select(
      "id, full_name, slug, photo_url, specialties, short_summary, bio, languages, gender, years_experience, is_verified, contact_phone"
    )
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: "could not load therapists" }, { status: 500 });
  }
  if (!therapists || therapists.length === 0) {
    return NextResponse.json({ matches: [] });
  }

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
