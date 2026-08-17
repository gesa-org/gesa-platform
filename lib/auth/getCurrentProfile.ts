import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

// Server-side helper: who's signed in, and what's their profile row (which
// carries `role`). Returns null when signed out — callers decide what to do
// with that (redirect to login, show a signed-out state, etc.).
export async function getCurrentProfile(): Promise<Tables<"profiles"> | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}
