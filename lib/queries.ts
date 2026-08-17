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

export async function getActiveClinicLocations(): Promise<Tables<"clinic_locations">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_locations")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
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

export async function getTherapistBySlug(slug: string): Promise<Tables<"therapists"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("therapists")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("is_verified", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Admin-only reads below. Every one of these relies on the *_admin_read
// RLS policies (admin/reviewer) — they run under the signed-in admin's own
// session via lib/supabase/server.ts, never a service-role client. The page
// calling these must already be gated by requireAdmin() (see
// lib/auth/requireAdmin.ts); RLS is the real enforcement, the page guard is
// defense-in-depth.

export async function getAllInquiries(): Promise<Tables<"inquiries">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllGroupRegistrations(): Promise<Tables<"group_registrations">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type BookingRequestWithTherapist = Tables<"booking_requests"> & {
  matched_therapist: Pick<Tables<"therapists">, "id" | "full_name" | "contact_email"> | null;
};

export async function getAllBookingRequests(): Promise<BookingRequestWithTherapist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*, matched_therapist:therapists(id, full_name, contact_email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BookingRequestWithTherapist[];
}

export type MatchRequestWithTherapist = Tables<"match_requests"> & {
  selected_therapist: Pick<Tables<"therapists">, "id" | "full_name" | "contact_email" | "contact_phone"> | null;
  clinic_location: Pick<Tables<"clinic_locations">, "id" | "name" | "address"> | null;
};

export async function getAllMatchRequests(): Promise<MatchRequestWithTherapist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_requests")
    .select("*, selected_therapist:therapists(id, full_name, contact_email, contact_phone), clinic_location:clinic_locations(id, name, address)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MatchRequestWithTherapist[];
}

export async function getAllProfiles(): Promise<Tables<"profiles">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
