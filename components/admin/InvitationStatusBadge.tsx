import type { Tables } from "@/lib/database.types";

// Phase 187 — "Account onboarding" status, derived from the latest
// invitation row (or its absence) for a given therapist/admin profile. This
// is intentionally a *derived* status, not a stored column — an
// invitation's own status plus whether it's expired is always the single
// source of truth, so there's nothing to keep in sync.
export type OnboardingStatus =
  | "no_account"
  | "invitation_sent"
  | "invitation_expired"
  | "invitation_revoked"
  | "invitation_failed"
  | "account_active";

export function deriveOnboardingStatus(hasAccount: boolean, latestInvitation: Tables<"invitations"> | null): OnboardingStatus {
  if (hasAccount) return "account_active";
  if (!latestInvitation) return "no_account";
  if (latestInvitation.status === "revoked") return "invitation_revoked";
  if (latestInvitation.status === "failed") return "invitation_failed";
  if (latestInvitation.status === "accepted") return "account_active";
  const expired = new Date(latestInvitation.token_expires_at).getTime() < Date.now();
  if (expired && (latestInvitation.status === "sent" || latestInvitation.status === "opened")) return "invitation_expired";
  if (latestInvitation.status === "sent" || latestInvitation.status === "opened") return "invitation_sent";
  return "no_account";
}

const LABELS: Record<OnboardingStatus, string> = {
  no_account: "No account",
  invitation_sent: "Invitation sent",
  invitation_expired: "Invitation expired",
  invitation_revoked: "Invitation revoked",
  invitation_failed: "Invitation failed",
  account_active: "Account active",
};

const STYLES: Record<OnboardingStatus, string> = {
  no_account: "bg-secondary text-muted-fg",
  invitation_sent: "bg-clay-soft text-clay",
  invitation_expired: "bg-destructive/10 text-destructive",
  invitation_revoked: "bg-destructive/10 text-destructive",
  invitation_failed: "bg-destructive/10 text-destructive",
  account_active: "bg-accent-soft text-primary",
};

export default function InvitationStatusBadge({ status }: { status: OnboardingStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STYLES[status]}`}>{LABELS[status]}</span>;
}
