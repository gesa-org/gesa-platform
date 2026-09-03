export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "admin" | "reviewer" | "therapist" | "client" | "finance";
export type DocumentStatus = "pending" | "approved" | "rejected" | "expired";
export type DocumentType = "certificate" | "license" | "insurance" | "agreement";
export type GenderType = "woman" | "man" | "nonbinary" | "no_preference";
export type SessionDuration = "30" | "45" | "60" | "90";
export type TrackType = "war_terror" | "antisemitism_diaspora" | "helping_helpers" | "group_support";

export type BlogPostRow = {
  author: string | null;
  body: string | null;
  category: string | null;
  created_at: string;
  id: string;
  published_at: string | null;
  slug: string;
  status: string;
  subtitle: string | null;
  title: string;
}

export type ChatMessageRow = {
  body: string;
  created_at: string;
  id: string;
  read_at: string | null;
  sender_id: string;
  thread_id: string;
}

export type ChatThreadRow = {
  client_id: string;
  created_at: string;
  id: string;
  therapist_id: string;
}

export type ClientRow = {
  country: string | null;
  created_at: string;
  email: string | null;
  free_sessions_total: number;
  free_sessions_used: number;
  full_name: string | null;
  guardian_consent_at: string | null;
  id: string;
  is_minor: boolean;
  is_soldier_or_crisis: boolean;
  no_show_count: number;
  phone: string | null;
  profile_id: string | null;
  track: TrackType | null;
}

export type CrisisResourceRow = {
  created_at: string;
  hotline: string;
  hours: string | null;
  id: string;
  language: string | null;
  notes: string | null;
  region: string;
}

export type FaqRow = {
  answer: string;
  id: string;
  question: string;
  sort: number;
}

export type GroupRegistrationRow = {
  created_at: string;
  email: string;
  group_id: string;
  id: string;
  name: string;
  phone: string | null;
}

export type InquiryRow = {
  created_at: string;
  email: string | null;
  id: string;
  message: string | null;
  name: string | null;
  phone: string | null;
  type: string | null;
}

export type LegalPageRow = {
  body: string;
  id: string;
  slug: string;
  title: string;
  updated_at: string;
}

export type ProfileRow = {
  country: string | null;
  created_at: string;
  email: string | null;
  full_name: string | null;
  id: string;
  phone: string | null;
  preferred_language: string | null;
  role: AppRole;
  updated_at: string;
}

export type SiteContentRow = {
  id: string;
  key: string;
  updated_at: string;
  value: Json;
}

export type SupportGroupRow = {
  capacity: number | null;
  created_at: string;
  description: string | null;
  facilitator_name: string | null;
  format: string | null;
  id: string;
  location: string | null;
  register_url: string | null;
  schedule: string | null;
  title: string;
}

export type TestimonialRow = {
  author: string;
  id: string;
  quote: string;
  role: string | null;
  sort: number;
}

// Phase 126 — added diary_link/diary_link_status/country/price_note
// (migration: add_diary_link_country_price_to_therapists). contact_email/
// contact_phone are also declared here since admin/self code still reads
// them via the `get_therapist_contact` RPC or direct authenticated access —
// only the `anon` role had column-level SELECT revoked on these two (see
// the `therapists_public` view below and lib/queries.ts), so the shape of
// a full authenticated row is unchanged.
export type DiaryLinkStatus = "valid" | "invalid" | "unset";

export type TherapistRow = {
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string | null;
  created_at: string;
  credentials: string | null;
  diary_link: string | null;
  diary_link_status: DiaryLinkStatus;
  full_name: string;
  gender: GenderType | null;
  id: string;
  is_active: boolean;
  is_verified: boolean;
  languages: string[];
  photo_url: string | null;
  price_note: string | null;
  profile_id: string | null;
  session_lengths: SessionDuration[];
  short_summary: string | null;
  slug: string;
  specialties: string[];
  time_zone: string | null;
  tracks: TrackType[];
  updated_at: string;
  verified_at: string | null;
  verified_by: string | null;
  years_experience: number | null;
}

// Phase 126 — the `therapists_public` view's exact column list (see
// migration create_public_safe_therapists_view_and_lock_anon_columns).
// Deliberately excludes contact_email/contact_phone, is_active,
// profile_id, verified_at/verified_by — nothing an unauthenticated visitor
// needs, and (for the two contact fields) nothing they're allowed to have.
// Every public-facing query in lib/queries.ts returns this shape, not the
// full TherapistRow, so a confidential field simply cannot flow into a
// public page's props by accident — there's no field to forget to strip.
export type PublicTherapistRow = Pick<
  TherapistRow,
  | "id"
  | "full_name"
  | "slug"
  | "bio"
  | "credentials"
  | "gender"
  | "is_verified"
  | "languages"
  | "photo_url"
  | "session_lengths"
  | "short_summary"
  | "specialties"
  | "time_zone"
  | "tracks"
  | "years_experience"
  | "diary_link"
  | "diary_link_status"
  | "country"
  | "price_note"
  | "created_at"
  | "updated_at"
> & {
  // Derived boolean, not the phone number itself — lets the UI offer/hide
  // the WhatsApp contact channel without ever sending a confidential
  // contact_phone value to a page an unauthenticated visitor can load.
  has_whatsapp: boolean;
};

export type BookingRequestRow = {
  created_at: string;
  email: string;
  entry_route: string;
  id: string;
  matched_therapist_id: string | null;
  name: string;
  status: string;
}

export type ClinicLocationRow = {
  address: string;
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
}

export type GenderPreference = "woman" | "man" | "nonbinary" | "no_preference";
export type SessionFormat = "online" | "call" | "in_person";

export type MatchRequestRow = {
  ai_reasoning: Json | null;
  clinic_location_id: string | null;
  created_at: string;
  email: string;
  gender_preference: GenderPreference;
  id: string;
  matched_therapist_ids: string[];
  name: string;
  phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  selected_therapist_id: string | null;
  session_format: SessionFormat;
  status: string;
  symptoms: string[];
  treatment_type: string | null;
}

export type TranslationCacheRow = {
  created_at: string;
  id: string;
  source_hash: string;
  source_text: string;
  target_lang: string;
  translated_text: string;
}

export type TherapistWeeklyHoursRow = {
  id: string;
  therapist_id: string;
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  start_time: string; // "HH:MM:SS", therapist's own local time (see therapists.time_zone)
  end_time: string;
  created_at: string;
}

export type ContactChannel = "email" | "whatsapp" | "zoom";
export type BookingStatus = "confirmed" | "cancelled";

export type SessionBookingRow = {
  id: string;
  therapist_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  // Phase 54 — added alongside the "Book a Session" modal's new City,
  // Year of birth, and terms/privacy consent fields (components/intake/
  // IntakeBookingModal.tsx). Consent is stored as *when* it was given
  // (nullable — always set together, always non-null on any row inserted
  // after this phase) rather than a plain boolean, for a real timestamped
  // compliance record.
  client_city: string | null;
  client_birth_year: number | null;
  agreed_terms_at: string | null;
  agreed_privacy_at: string | null;
  session_date: string; // "YYYY-MM-DD"
  session_time: string; // "HH:MM:SS"
  contact_channel: ContactChannel;
  path: string | null;
  status: BookingStatus;
  created_at: string;
}

export type DiarySchedulingStatus = "opened" | "confirmed";

// Phase 126 — records a client being handed off to a therapist's own
// diary-link scheduling page (Google Calendar appointment schedule,
// Calendly, simplybook.it). None of those providers give this app a
// callback/webhook when a slot is actually booked, so `status` only ever
// gets set to "opened" by the app itself; "confirmed" exists in the type/
// check constraint for a future integration but nothing writes it today —
// see the diary-scheduling API route.
export type DiarySchedulingEventRow = {
  id: string;
  therapist_id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  time_zone: string | null;
  diary_link: string;
  status: DiarySchedulingStatus;
  created_at: string;
};

// Phase 63 — a real, structured intake for the "become a volunteer
// therapist" flow (see components/volunteer/VolunteerApplicationModal.tsx),
// replacing what used to just be the generic Contact form's "Volunteer"
// subject option. `status` mirrors the simple string-status convention
// already used by booking_requests/match_requests ("new", etc.) rather than
// a DB enum, for the same reason those use plain strings.
// Phase 64 — Roy asked for a required "Meeting Duration" field alongside
// the rest of the volunteer application. Phase 65 replaced the original
// fixed "Anytime" choice with "Specify time": a volunteer either picks one
// of the three presets, or types their own free-text duration (e.g. "2
// hours") which is meant to show on their public profile once listed. So
// only the *picker's* own state is a closed set — the real `meeting_duration`
// column value can be a preset ("60"/"45"/"30") or arbitrary custom text,
// which is why `TherapistApplicationRow.meeting_duration` stays a plain
// `string` rather than this union.
export type MeetingDurationChoice = "60" | "45" | "30" | "custom";

export type TherapistApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  credentials_proof: string;
  specialties: string[];
  languages: string[];
  meeting_duration: string;
  bio: string;
  status: string;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Phase 98 — donation "gift intent" capture from the new /donate page's
// giving form. No payment processor is connected yet (see EXECUTION_PLAN.md
// Phase 98), so this table is a lead/intent log — same shape/purpose as
// InquiryRow above, just with the frequency/amount fields a gift needs
// instead of a free-text message. `amount_choice` records which tile the
// visitor picked ("25"/"50"/"100"/"custom") separately from the resolved
// numeric `amount`, so the admin view can tell a €25 preset pick apart from
// someone who typed "25" into the custom field.
// Phase 99 — added the Mollie payment fields (status/currency/
// mollie_payment_id/paid_at) once Roy asked to connect the /donate page's
// gift-intent capture to a real payment processor. `status` starts at
// "open" the moment DonateForm creates the row (before the donor even
// reaches Mollie's checkout), moves to "paid"/"failed"/"canceled"/"expired"
// once Mollie's webhook reports back — see app/api/webhooks/mollie/route.ts.
export type DonationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  frequency: string;
  amount: number;
  amount_choice: string | null;
  message: string | null;
  status: string;
  currency: string;
  mollie_payment_id: string | null;
  // Set only for "monthly" donations — a Mollie Customer is created up
  // front (Mollie's Recurring flow needs one to attach the mandate/
  // subscription to), and mollie_subscription_id is filled in once the
  // first payment clears and the webhook creates the actual recurring
  // Subscription (see app/api/webhooks/mollie/route.ts).
  mollie_customer_id: string | null;
  mollie_subscription_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.15" };
  public: {
    Tables: {
      blog_posts: { Row: BlogPostRow; Insert: Partial<BlogPostRow> & Pick<BlogPostRow, "slug" | "title">; Update: Partial<BlogPostRow>; Relationships: [] };
      donations: {
        Row: DonationRow;
        Insert: Partial<DonationRow> & Pick<DonationRow, "full_name" | "email" | "frequency" | "amount">;
        Update: Partial<DonationRow>;
        Relationships: [];
      };
      booking_requests: {
        Row: BookingRequestRow;
        Insert: Partial<BookingRequestRow> & Pick<BookingRequestRow, "entry_route" | "name" | "email">;
        Update: Partial<BookingRequestRow>;
        Relationships: [
          {
            foreignKeyName: "booking_requests_matched_therapist_id_fkey";
            columns: ["matched_therapist_id"];
            isOneToOne: false;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: { Row: ChatMessageRow; Insert: Partial<ChatMessageRow> & Pick<ChatMessageRow, "body" | "sender_id" | "thread_id">; Update: Partial<ChatMessageRow>; Relationships: [] };
      clinic_locations: { Row: ClinicLocationRow; Insert: Partial<ClinicLocationRow> & Pick<ClinicLocationRow, "name" | "address">; Update: Partial<ClinicLocationRow>; Relationships: [] };
      match_requests: {
        Row: MatchRequestRow;
        Insert: Partial<MatchRequestRow> & Pick<MatchRequestRow, "name" | "email" | "session_format">;
        Update: Partial<MatchRequestRow>;
        Relationships: [
          {
            foreignKeyName: "match_requests_clinic_location_id_fkey";
            columns: ["clinic_location_id"];
            isOneToOne: false;
            referencedRelation: "clinic_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_requests_selected_therapist_id_fkey";
            columns: ["selected_therapist_id"];
            isOneToOne: false;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_threads: {
        Row: ChatThreadRow;
        Insert: Partial<ChatThreadRow> & Pick<ChatThreadRow, "client_id" | "therapist_id">;
        Update: Partial<ChatThreadRow>;
        Relationships: [
          {
            foreignKeyName: "chat_threads_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_threads_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: false;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: { Row: ClientRow; Insert: Partial<ClientRow>; Update: Partial<ClientRow>; Relationships: [] };
      crisis_resources: { Row: CrisisResourceRow; Insert: Partial<CrisisResourceRow> & Pick<CrisisResourceRow, "hotline" | "region">; Update: Partial<CrisisResourceRow>; Relationships: [] };
      faqs: { Row: FaqRow; Insert: Partial<FaqRow> & Pick<FaqRow, "question" | "answer">; Update: Partial<FaqRow>; Relationships: [] };
      group_registrations: { Row: GroupRegistrationRow; Insert: Partial<GroupRegistrationRow> & Pick<GroupRegistrationRow, "email" | "group_id" | "name">; Update: Partial<GroupRegistrationRow>; Relationships: [] };
      inquiries: { Row: InquiryRow; Insert: Partial<InquiryRow>; Update: Partial<InquiryRow>; Relationships: [] };
      legal_pages: { Row: LegalPageRow; Insert: Partial<LegalPageRow> & Pick<LegalPageRow, "slug" | "title">; Update: Partial<LegalPageRow>; Relationships: [] };
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow> & Pick<ProfileRow, "id">; Update: Partial<ProfileRow>; Relationships: [] };
      site_content: { Row: SiteContentRow; Insert: Partial<SiteContentRow> & Pick<SiteContentRow, "key">; Update: Partial<SiteContentRow>; Relationships: [] };
      support_groups: { Row: SupportGroupRow; Insert: Partial<SupportGroupRow> & Pick<SupportGroupRow, "title">; Update: Partial<SupportGroupRow>; Relationships: [] };
      testimonials: { Row: TestimonialRow; Insert: Partial<TestimonialRow> & Pick<TestimonialRow, "author" | "quote">; Update: Partial<TestimonialRow>; Relationships: [] };
      therapist_applications: {
        Row: TherapistApplicationRow;
        Insert: Partial<TherapistApplicationRow> & Pick<TherapistApplicationRow, "full_name" | "email" | "credentials_proof" | "bio" | "meeting_duration">;
        Update: Partial<TherapistApplicationRow>;
        Relationships: [
          {
            foreignKeyName: "therapist_applications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      therapists: { Row: TherapistRow; Insert: Partial<TherapistRow> & Pick<TherapistRow, "full_name" | "slug">; Update: Partial<TherapistRow>; Relationships: [] };
      // Phase 126 — read-only view (see migration
      // create_public_safe_therapists_view_and_lock_anon_columns). Insert/
      // Update are `never`, not `Partial<PublicTherapistRow>`, so trying to
      // write through this view is a compile error, not just an RLS/grant
      // failure at runtime — this view exists specifically so public code
      // paths can't touch contact_email/contact_phone, and that intent
      // should be visible in the type, not just enforced by Postgres.
      therapists_public: { Row: PublicTherapistRow; Insert: never; Update: never; Relationships: [] };
      therapist_weekly_hours: {
        Row: TherapistWeeklyHoursRow;
        Insert: Partial<TherapistWeeklyHoursRow> & Pick<TherapistWeeklyHoursRow, "therapist_id" | "day_of_week" | "start_time" | "end_time">;
        Update: Partial<TherapistWeeklyHoursRow>;
        Relationships: [
          {
            foreignKeyName: "therapist_weekly_hours_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: false;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ];
      };
      session_bookings: {
        Row: SessionBookingRow;
        Insert: Partial<SessionBookingRow> & Pick<SessionBookingRow, "therapist_id" | "client_name" | "client_email" | "session_date" | "session_time" | "contact_channel">;
        Update: Partial<SessionBookingRow>;
        Relationships: [
          {
            foreignKeyName: "session_bookings_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: false;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ];
      };
      diary_scheduling_events: {
        Row: DiarySchedulingEventRow;
        Insert: Partial<DiarySchedulingEventRow> & Pick<DiarySchedulingEventRow, "therapist_id" | "diary_link">;
        Update: Partial<DiarySchedulingEventRow>;
        Relationships: [
          {
            foreignKeyName: "diary_scheduling_events_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: false;
            referencedRelation: "therapists";
            referencedColumns: ["id"];
          },
        ];
      };
      translation_cache: {
        Row: TranslationCacheRow;
        Insert: Partial<TranslationCacheRow> & Pick<TranslationCacheRow, "source_hash" | "target_lang" | "source_text" | "translated_text">;
        Update: Partial<TranslationCacheRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      auth_role: { Args: Record<string, never>; Returns: AppRole };
      get_or_create_my_client: { Args: Record<string, never>; Returns: string };
      get_or_create_thread: { Args: { p_therapist_id: string }; Returns: string };
      get_booked_slots: { Args: { p_therapist_id: string; p_date: string }; Returns: { session_time: string }[] };
      // Phase 126 — SECURITY DEFINER RPC, the sanctioned path for
      // admin/therapist-self reads of confidential contact fields now that
      // anon/authenticated column-level SELECT is locked down on the base
      // table for the public-facing case. See getTherapistByIdAdmin in
      // lib/queries.ts for the only current caller.
      get_therapist_contact: {
        Args: { p_therapist_id: string };
        Returns: { contact_email: string | null; contact_phone: string | null }[];
      };
    };
    Enums: {
      app_role: AppRole;
      document_status: DocumentStatus;
      document_type: DocumentType;
      gender_type: GenderType;
      session_duration: SessionDuration;
      track_type: TrackType;
    };
    CompositeTypes: Record<string, never>;
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"];
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T];
