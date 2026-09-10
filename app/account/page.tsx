import Link from "next/link";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/requireUser";
import AccountForm from "@/components/account/AccountForm";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  reviewer: "Reviewer",
  therapist: "Therapist",
  client: "Client",
  finance: "Finance",
};

export default async function AccountPage() {
  const profile = await requireUser("/account");

  return (
    <section className="section wrap max-w-[640px]">
      <span className="eyebrow">Your account</span>
      <h1 className="mb-2 text-[30px]">My Account</h1>
      <p className="mb-7 text-muted-fg">
        View and update your details. Your email is tied to your login and can&apos;t be changed here.
      </p>

      <div className="mb-6 flex items-center justify-between rounded-[var(--radius)] border border-border bg-card p-5">
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-wide text-muted-fg">Role</div>
          <div className="mt-0.5 text-[15px] font-medium text-primary">
            {ROLE_LABEL[profile.role] ?? profile.role}
          </div>
        </div>
        {profile.role === "admin" && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-[13.5px] font-semibold text-primary transition-colors hover:bg-secondary"
          >
            <ShieldCheck size={15} /> Go to CRM Dashboard
          </Link>
        )}
      </div>

      {/* Phase 179 — new; links to /account/bookings, the client-facing
          view of their own session_bookings rows (client_profile_id-scoped,
          via session_bookings_client_read RLS). */}
      <Link
        href="/account/bookings"
        className="mb-6 flex items-center justify-between rounded-[var(--radius)] border border-border bg-card p-5 transition-colors hover:bg-secondary"
      >
        <div className="flex items-center gap-2.5">
          <CalendarClock size={18} className="text-primary" />
          <div>
            <div className="text-[15px] font-medium">My Bookings</div>
            <div className="text-[13px] text-muted-fg">View your session booking history</div>
          </div>
        </div>
      </Link>

      <AccountForm profile={profile} />
      {/* Phase 175 — new; previously the only way to change a password was
          the forgot-password email flow. */}
      <ChangePasswordForm />
    </section>
  );
}
