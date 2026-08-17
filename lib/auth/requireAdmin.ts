import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import type { Tables } from "@/lib/database.types";

// Server-side guard for every /admin/** page and admin-only server action.
// Per explicit product requirement: all administrative and management
// functions are restricted to the "admin" role only — not "reviewer" or any
// other role, even though some read-only RLS policies elsewhere in the app
// bundle admin + reviewer together for unrelated features.
//
// This is defense-in-depth on top of Postgres RLS, not a replacement for it:
// every query an admin page makes still runs under that user's own session
// and is independently enforced by the *_admin_read / *_admin_update
// policies in the database. Even if a page forgot to call this guard, RLS
// still blocks a non-admin from reading or writing the underlying rows.
export async function requireAdmin(): Promise<Tables<"profiles">> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?next=/admin");
  }
  if (profile.role !== "admin") {
    redirect("/");
  }

  return profile;
}
