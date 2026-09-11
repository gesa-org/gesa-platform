import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import type { Tables } from "@/lib/database.types";

// Phase 187 — the small set of actions restricted to Super Admin even
// within the CRM: inviting another Super Admin, deactivating a Super Admin
// account, and (per the spec's "optional fallback") copying a raw
// invitation link instead of only ever emailing it. Everything else that
// merely needs "signed-in CRM staff" should use requireAdmin() instead —
// this is intentionally the narrower gate.
export async function requireSuperAdmin(): Promise<Tables<"profiles">> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?next=/admin");
  }
  if (profile.role !== "super_admin") {
    redirect("/admin");
  }

  return profile;
}
