import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type TherapistSelf = {
  profile: Tables<"profiles">;
  therapist: Pick<Tables<"therapists">, "id" | "full_name" | "slug" | "photo_url" | "is_active">;
};

// Server-side guard for /therapist/** pages, mirroring requireAdmin.ts's
// shape. Two things can legitimately be true for a signed-in "therapist"
// role account that requireAdmin doesn't have to worry about: (1) the role
// exists but no therapists row has been linked to it yet (profile_id is set
// by an admin from the professional's edit page, as a separate step from
// creating the login — see TherapistEditForm's "Professional login"
// section), and (2) that link could point at a since-deactivated record.
// Both are handled by returning null rather than throwing, so the page can
// show a clear "not linked yet, contact GESA" message instead of a crash.
export async function requireTherapist(): Promise<TherapistSelf | null> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?next=/therapist");
  }
  if (profile.role !== "therapist") {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, full_name, slug, photo_url, is_active")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!therapist) return null;
  return { profile, therapist };
}
