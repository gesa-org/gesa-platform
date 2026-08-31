import { requireAdmin } from "@/lib/auth/requireAdmin";
import AdminNav from "@/components/admin/AdminNav";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sessions", label: "Session bookings" },
  { href: "/admin/match-requests", label: "Find Your Therapist" },
  { href: "/admin/bookings", label: "Booking requests" },
  { href: "/admin/volunteer-applications", label: "Volunteer Applications" },
  { href: "/admin/donations", label: "Donations" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/registrations", label: "Group registrations" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/therapists", label: "Therapists" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content Manager (Editing Details)" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate every /admin/** route in one place. Redirects signed-out visitors
  // to /login and signed-in non-admins to the homepage — see
  // lib/auth/requireAdmin.ts for why this is admin-only, not admin+reviewer.
  const profile = await requireAdmin();

  return (
    // Phase 60 — full-page brushed-gold background per Roy's reference
    // mockup (see .admin-gold-bg in globals.css). Nav labels/hrefs below are
    // unchanged from before this phase — only the visual chrome changed.
    <div className="admin-gold-bg min-h-[70vh]">
      <div className="wrap py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {/* Not `.eyebrow` here — that class renders in --clay gold,
                which disappears against this page's own gold background.
                A plain dark-slate label keeps it legible. */}
            <span className="mb-2 inline-block text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
              Admin
            </span>
            <h1 className="text-[26px] text-primary">CRM Dashboard</h1>
          </div>
          <div className="rounded-full bg-card/70 px-4 py-2 text-sm text-primary shadow-soft backdrop-blur-sm">
            Signed in as {profile.full_name || profile.email}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
          <AdminNav items={NAV} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
