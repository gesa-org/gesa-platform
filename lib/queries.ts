import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

// Server-side read helpers. All of these run under the anon key + RLS —
// no service role needed since every table here has a public-read policy.

export async function getActiveTherapists(): Promise<Tables<"therapists">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("therapists")
    .select("*")
    .eq("is_active", true)
    .eq("is_verified", true)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function getSupportGroups(): Promise<Tables<"support_groups">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("support_groups").select("*").order("title");
  if (error) throw error;
  return data ?? [];
}

export async function getFaqs(): Promise<Tables<"faqs">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("faqs").select("*").order("sort");
  if (error) throw error;
  return data ?? [];
}

export async function getTestimonials(): Promise<Tables<"testimonials">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("testimonials").select("*").order("sort");
  if (error) throw error;
  return data ?? [];
}

export async function getPublishedBlogPosts(): Promise<Tables<"blog_posts">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBlogPostBySlug(slug: string): Promise<Tables<"blog_posts"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLegalPage(slug: string): Promise<Tables<"legal_pages"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("legal_pages").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSiteContent<T = unknown>(key: string): Promise<T | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_content").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return (data?.value as T) ?? null;
}

export async function getCrisisResources(): Promise<Tables<"crisis_resources">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("crisis_resources").select("*").order("region");
  if (error) throw error;
  return data ?? [];
}

// Picks one active, verified therapist at random. This is a simple MVP match
// — real specialty/track data isn't rich enough yet to filter meaningfully by
// entry route (see EXECUTION_PLAN.md Phase 7 notes), so every non-crisis path
// draws from the same pool of verified therapists for now.
export async function getRandomMatchedTherapist(): Promise<Tables<"therapists"> | null> {
  const therapists = await getActiveTherapists();
  if (therapists.length === 0) return null;
  return therapists[Math.floor(Math.random() * therapists.length)];
}
