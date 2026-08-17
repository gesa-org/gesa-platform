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

export type TherapistRow = {
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  credentials: string | null;
  full_name: string;
  gender: GenderType | null;
  id: string;
  is_active: boolean;
  is_verified: boolean;
  languages: string[];
  photo_url: string | null;
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

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.15" };
  public: {
    Tables: {
      blog_posts: { Row: BlogPostRow; Insert: Partial<BlogPostRow> & Pick<BlogPostRow, "slug" | "title">; Update: Partial<BlogPostRow>; Relationships: [] };
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
      therapists: { Row: TherapistRow; Insert: Partial<TherapistRow> & Pick<TherapistRow, "full_name" | "slug">; Update: Partial<TherapistRow>; Relationships: [] };
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
