import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import type { Tables } from "@/lib/database.types";

// Server-side guard for any page that just needs "someone is signed in" —
// no role restriction, unlike requireAdmin(). Redirects to /login with a
// return path so the user lands back where they meant to go.
export async function requireUser(nextPath: string): Promise<Tables<"profiles">> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return profile;
}
