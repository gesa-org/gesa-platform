// Phase 63 — shared, plain (no server-only imports) types/constants for the
// CRM Dashboard's Scheduling Overview calendar. Split out of
// app/admin/page.tsx specifically so components/admin/SchedulingCalendar.tsx
// (a Client Component) can import the CalendarEvent shape and the
// legend/label constants without pulling app/admin/page.tsx's own module
// graph — which imports lib/queries.ts's server-only Supabase calls — into
// the client bundle. A Client Component importing anything from a Server
// Component's own file, even just a type or a constant, drags that whole
// file's imports along with it; keeping this data in its own leaf module
// avoids that entirely.
export type CalendarEvent = {
  kind: "session" | "match" | "booking" | "inquiry" | "registration";
  dateIso: string;
  time: string | null;
  personLabel: string;
  statusLabel: string;
  dotClass: string;
};

export const EVENT_LEGEND: { kind: CalendarEvent["kind"]; label: string; dotClass: string }[] = [
  { kind: "session", label: "Sessions", dotClass: "bg-amber" },
  { kind: "match", label: "Find Your Therapist", dotClass: "bg-clay" },
  { kind: "booking", label: "Booking requests", dotClass: "bg-accent" },
  { kind: "inquiry", label: "Inquiries", dotClass: "bg-primary/70" },
  { kind: "registration", label: "Group registrations", dotClass: "bg-primary-600" },
];

export const KIND_LABELS: Record<CalendarEvent["kind"], string> = {
  session: "Session",
  match: "Find Your Therapist request",
  booking: "Booking request",
  inquiry: "Inquiry",
  registration: "Group registration",
};
