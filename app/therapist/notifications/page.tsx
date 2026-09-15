import { Bell } from "lucide-react";
import { requireTherapist } from "@/lib/auth/requireTherapist";
import TherapistNotificationsList from "@/components/therapist/TherapistNotificationsList";

export const dynamic = "force-dynamic";

// Phase 208 — full-page "Notifications" (see app/therapist/layout.tsx's new
// sidebar). This is a read-only, additive view of the same feed the header
// bell already shows this therapist (see TherapistNotificationsList.tsx's
// own comment) — it does not change the bell's behavior, data source, or
// "today only" scoping in any way.
export default async function TherapistNotificationsPage() {
  const self = await requireTherapist();

  if (!self) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-1.5 text-lg">Your account isn&apos;t linked to a professional profile yet</h2>
        <p className="text-[14px] text-muted-fg">
          This login exists, but no professional record points to it yet. Contact the GESA team so an admin can
          link your account from your profile&apos;s edit page.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg">
        <Bell size={18} className="text-primary" /> Notifications
      </h2>
      <p className="mb-4 text-[13px] text-muted-fg">Recent booking activity for your own sessions.</p>
      <TherapistNotificationsList />
    </div>
  );
}
