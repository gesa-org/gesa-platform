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

// Admin-only: unlike getActiveTherapists(), this doesn't filter on
// is_active/is_verified, so deactivated ("deleted") therapists still show up
// for an admin to review or reactivate. Relies on the pre-existing
// therapists_self_read RLS policy, which already grants admin/reviewer read
// access to every therapist row.
export async function getAllTherapistsAdmin(): Promise<Tables<"therapists">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("therapists").select("*").order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function getTherapistByIdAdmin(id: string): Promise<Tables<"therapists"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("therapists").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
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

export type SessionBookingWithTherapist = Tables<"session_bookings"> & {
  therapist: Pick<Tables<"therapists">, "id" | "full_name" | "contact_email"> | null;
};

// Phase 20 — admin visibility into real, conflict-free session bookings
// (session_bookings), distinct from the older, unconstrained "preferred
// time" requests in match_requests/booking_requests. Every row here
// represents an actually-reserved slot (enforced by a DB unique constraint,
// not just a request).
export async function getAllSessionBookings(): Promise<SessionBookingWithTherapist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_bookings")
    .select("*, therapist:therapists(id, full_name, contact_email)")
    .order("session_date", { ascending: true })
    .order("session_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as SessionBookingWithTherapist[];
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

// Admin-only monitoring view over client<->therapist chat. RLS on
// chat_threads/chat_messages already grants admin read access (see
// EXECUTION_PLAN.md Phase 10 — "OR auth_role() = 'admin'" was already present
// before this phase); this just adds the admin-facing query + UI that never
// existed.
export type ChatThreadSummary = {
  id: string;
  createdAt: string;
  clientName: string;
  therapistName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  messageCount: number;
};

export async function getAllChatThreads(): Promise<ChatThreadSummary[]> {
  const supabase = await createClient();
  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select("id, created_at, clients(full_name), therapists(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!threads) return [];

  const threadIds = threads.map((t) => t.id);
  const lastByThread = new Map<string, { body: string; created_at: string }>();
  const countByThread = new Map<string, number>();

  if (threadIds.length) {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("thread_id, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });
    messages?.forEach((m) => {
      countByThread.set(m.thread_id, (countByThread.get(m.thread_id) ?? 0) + 1);
      if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
    });
  }

  return threads.map((t) => {
    const last = lastByThread.get(t.id);
    return {
      id: t.id,
      createdAt: t.created_at,
      clientName: t.clients?.full_name ?? "Client",
      therapistName: t.therapists?.full_name ?? "Therapist",
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.created_at ?? null,
      messageCount: countByThread.get(t.id) ?? 0,
    };
  });
}

export type ChatMessageWithSenderLabel = Tables<"chat_messages"> & { senderLabel: string };

export async function getChatThreadForAdmin(
  threadId: string
): Promise<{ clientName: string; therapistName: string; messages: ChatMessageWithSenderLabel[] } | null> {
  const supabase = await createClient();
  const { data: thread, error } = await supabase
    .from("chat_threads")
    .select("id, clients(full_name, profile_id), therapists(full_name, profile_id)")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw error;
  if (!thread) return null;

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const clientProfileId = thread.clients?.profile_id;
  const labeled = (messages ?? []).map((m) => ({
    ...m,
    senderLabel: m.sender_id === clientProfileId ? "Client" : "Therapist",
  }));

  return {
    clientName: thread.clients?.full_name ?? "Client",
    therapistName: thread.therapists?.full_name ?? "Therapist",
    messages: labeled,
  };
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
