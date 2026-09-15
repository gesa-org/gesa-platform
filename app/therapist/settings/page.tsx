import Link from "next/link";
import { UserCog, ShieldCheck } from "lucide-react";
import { requireTherapist } from "@/lib/auth/requireTherapist";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

export const dynamic = "force-dynamic";

// Phase 208 — "Profile / Settings," the last of the new 5-item sidebar (see
// app/therapist/layout.tsx). Deliberately scoped to account-level settings
// (password) plus a read-only summary and a link to the editable public
// profile, rather than a second full bio/credentials editor: every
// professional-facing field (bio, credentials, specialties, photo, diary
// link, etc.) already has one canonical editor —
// components/admin/TherapistEditForm.tsx — and duplicating that editing
// surface here would create two places that can write the same columns,
// which is exactly the kind of drift this app's existing conventions avoid
// (see e.g. the Phase 207 EXECUTION_PLAN.md entry on keeping one source of
// truth for a shared number). A therapist who needs a profile detail
// changed contacts the GESA team, same as today.
export default async function TherapistSettingsPage() {
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
    <div className="flex flex-col gap-6">
      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg">
          <UserCog size={18} className="text-primary" /> Profile
        </h2>
        <p className="mb-4 text-[13px] text-muted-fg">
          Your public-facing profile details (bio, credentials, specialties, photo) are managed by the GESA team.
          Contact them with any changes.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[15px] font-medium">{self.therapist.full_name}</span>
          <Link
            href={`/therapists/${self.therapist.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-[13.5px] font-semibold text-primary transition-colors hover:bg-secondary"
          >
            <ShieldCheck size={15} /> View my public profile
          </Link>
        </div>
      </div>

      {/* Reused verbatim from Account Settings (app/account/page.tsx) —
          same password policy, same "sign out other sessions on success"
          behavior, for every signed-in role including therapists. */}
      <ChangePasswordForm />
    </div>
  );
}
