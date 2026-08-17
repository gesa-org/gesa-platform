import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/requireUser";
import AccountForm from "@/components/account/AccountForm";

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

      <AccountForm profile={profile} />
    </section>
  );
}
