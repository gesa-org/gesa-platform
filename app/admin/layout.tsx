import { requireAdmin } from "@/lib/auth/requireAdmin";
import AdminNav from "@/components/admin/AdminNav";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sessions", label: "Session bookings" },
  // Phase 142 — the "Find Support" flow rebuild replaced match_requests
  // with the unified support_requests table (see EXECUTION_PLAN.md Phase
  // 142). New requests land in "Find Support requests" below.
  //
  // Phase 150 — CRM inquiry-architecture cleanup, per a full-repo audit:
  // "Find Your Therapist (legacy)" (app/admin/match-requests) duplicated
  // this exact workflow with frozen, pre-Phase-142 data, and the Overview
  // dashboard/notification bell were still silently reading match_requests
  // instead of support_requests — meaning current Find Support activity
  // was undercounted/misrepresented since Phase 142 shipped (see
  // app/admin/page.tsx and components/admin/NotificationBell.tsx, both
  // fixed this phase). The nav link is removed here so there's only one
  // discoverable destination for this workflow; the page itself is left
  // working and reachable by direct URL (/admin/match-requests) for
  // historical/audit access to whatever rows existed before Phase 142 —
  // not deleted, per this project's no-delete-data convention.
  { href: "/admin/support-requests", label: "Find Support requests" },
  { href: "/admin/bookings", label: "Booking requests" },
  { href: "/admin/volunteer-applications", label: "Volunteer Applications" },
  { href: "/admin/donations", label: "Donations" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/registrations", label: "Group registrations" },
  { href: "/admin/messages", label: "Messages" },
  // Phase 125 — sidebar label renamed "Therapists" -> "Our Professionals"
  // per Roy's request. Route (`/admin/therapists`) and every underlying
  // Supabase table/column name are unchanged on purpose — only this
  // admin-facing label and the other UI-facing strings in the section
  // itself changed (see components/admin/TherapistEditForm.tsx,
  // AddTherapistModal.tsx, TherapistsTable.tsx, and app/admin/therapists/**
  // for the rest). The admin dashboard has no i18n/translation system (only
  // the public site does — components/TranslationProvider.tsx), so there's
  // no Hebrew dictionary entry to update in parallel; every string in
  // app/admin/** is a hardcoded English literal.
  { href: "/admin/therapists", label: "Our Professionals" },
  { href: "/admin/users", label: "Users" },
  // Phase 187 — separate from "Users" above: invitation-only onboarding for
  // Administrator/Super Admin accounts specifically (invite, resend, revoke,
  // deactivate). "Users" keeps handling direct-create for Client/Reviewer/
  // Finance only as of this phase — see RoleSelect.tsx's own comment.
  { href: "/admin/administrators", label: "Administrators" },
  { href: "/admin/content", label: "Content Manager (Editing Details)" },
  // Phase 132 — the new visual design-token builder (colors, typography,
  // live preview, draft/publish). Deliberately a separate nav item from
  // "Content Manager" above rather than a tab inside it — Content Manager
  // edits page copy/text field-by-field with no preview; this edits
  // site-wide visual tokens with a live preview and an explicit Publish
  // step, a different enough workflow to warrant its own entry.
  { href: "/admin/ui-builder", label: "UI Builder" },
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
