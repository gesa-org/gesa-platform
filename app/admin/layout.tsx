import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sessions", label: "Session bookings" },
  { href: "/admin/match-requests", label: "Find Your Therapist" },
  { href: "/admin/bookings", label: "Booking requests" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/registrations", label: "Group registrations" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/therapists", label: "Therapists" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate every /admin/** route in one place. Redirects signed-out visitors
  // to /login and signed-in non-admins to the homepage — see
  // lib/auth/requireAdmin.ts for why this is admin-only, not admin+reviewer.
  const profile = await requireAdmin();

  return (
    <div className="min-h-[70vh] bg-secondary/40">
      <div className="wrap py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Admin</span>
            <h1 className="text-[26px]">CRM Dashboard</h1>
          </div>
          <div className="text-sm text-muted-fg">Signed in as {profile.full_name || profile.email}</div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
          <nav className="flex gap-2 overflow-x-auto rounded-[var(--radius)] border border-border bg-card p-3 lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium text-muted-fg transition-colors hover:bg-secondary hover:text-primary lg:whitespace-normal"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
