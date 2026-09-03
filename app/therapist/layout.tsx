import Link from "next/link";
import { requireTherapist } from "@/lib/auth/requireTherapist";

// Mirrors app/admin/layout.tsx's shape (one guard, one shared chrome) but
// much smaller — a therapist's dashboard is a single page today (their own
// bookings + diary handoffs), not a multi-section CRM, so there's no
// AdminNav-style sidebar here yet. If this grows a second page later, pull
// a nav out the same way admin's did.
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
        {children}
      </div>
    </div>
  );
}
