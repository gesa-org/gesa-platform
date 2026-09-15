import Link from "next/link";
import { LayoutDashboard, CalendarCheck2, CalendarDays, Bell, UserCog } from "lucide-react";
import { requireTherapist } from "@/lib/auth/requireTherapist";
import TherapistNav, { type TherapistNavItem } from "@/components/therapist/TherapistNav";

// Phase 208 — was a single flat page with no sidebar at all (see this
// file's own prior comment: "a therapist's dashboard is a single page
// today... If this grows a second page later, pull a nav out the same way
// admin's did."). It grew a second page — this pulls the nav out, the same
// way admin's did, per that comment's own plan. Order matches the explicit
// spec: Dashboard, My Bookings, My Diary, Notifications, Profile/Settings —
// "My Diary" immediately after "My Bookings".
const NAV: TherapistNavItem[] = [
  { href: "/therapist", label: "Dashboard", icon: LayoutDashboard },
  { href: "/therapist/bookings", label: "My Bookings", icon: CalendarCheck2 },
  // Calendar icon required next to this label specifically, per spec.
  { href: "/therapist/diary", label: "My Diary", icon: CalendarDays },
  { href: "/therapist/notifications", label: "Notifications", icon: Bell },
  { href: "/therapist/settings", label: "Profile / Settings", icon: UserCog },
];

export default async function TherapistLayout({ children }: { children: React.ReactNode }) {
  const self = await requireTherapist();

  return (
    <div className="min-h-[70vh] bg-secondary/30">
      <div className="wrap py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="mb-2 inline-block text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
              Professional dashboard
            </span>
            <h1 className="text-[26px]">
              {self ? `Welcome, ${self.therapist.full_name.split(" ")[0]}` : "Professional dashboard"}
            </h1>
          </div>
          {self && (
            <Link
              href={`/therapists/${self.therapist.slug}`}
              className="rounded-full bg-card px-4 py-2 text-sm font-medium text-primary shadow-soft"
            >
              View my public profile
            </Link>
          )}
        </div>
        {self ? (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
            <TherapistNav items={NAV} />
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
