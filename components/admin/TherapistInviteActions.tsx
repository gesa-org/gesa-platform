"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, RotateCw, Ban, History } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import InvitationStatusBadge, { deriveOnboardingStatus, type OnboardingStatus } from "@/components/admin/InvitationStatusBadge";
import type { Tables } from "@/lib/database.types";

// Phase 187 — per-row invitation actions for CRM > Our Professionals: Send
// / Resend / Revoke / View history, plus a plain "Account active" state
// with no actions once accepted. One component handles all of these states
// rather than five separate buttons, since only one is ever relevant for a
// given row at a time.
export default function TherapistInviteActions({
  therapistId,
  fullName,
  contactEmail,
  hasAccount,
  latestInvitation,
  history,
}: {
  therapistId: string;
  fullName: string;
  contactEmail: string | null;
  hasAccount: boolean;
  latestInvitation: Tables<"invitations"> | null;
  history: Tables<"invitations">[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const status: OnboardingStatus = deriveOnboardingStatus(hasAccount, latestInvitation);

  async function send() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactEmail,
          invitedRole: "therapist",
          therapistProfileId: therapistId,
          firstName: fullName.split(/\s+/)[0] ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not send the invitation.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the invitation.");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (!latestInvitation) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/invitations/${latestInvitation.id}/resend`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not resend the invitation.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend the invitation.");
    } finally {
      setPending(false);
    }
  }

  async function revoke() {
    if (!latestInvitation) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/invitations/${latestInvitation.id}/revoke`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not revoke the invitation.");
      setConfirmRevoke(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke the invitation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <InvitationStatusBadge status={status} />
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label={`View invitation history for ${fullName}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-fg hover:bg-secondary"
          >
            <History size={13} />
          </button>
        )}
      </div>

      {status === "account_active" && (
        <span className="text-[11.5px] text-muted-fg">Signed in with their own account.</span>
      )}

      {(status === "no_account" || status === "invitation_expired" || status === "invitation_revoked" || status === "invitation_failed") && (
        <button
          type="button"
          onClick={send}
          disabled={pending || !contactEmail}
          title={!contactEmail ? "No contact email on file" : undefined}
          className="inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-primary hover:underline disabled:opacity-50"
        >
          <Mail size={12} /> {pending ? "Sending…" : "Send invitation"}
        </button>
      )}

      {status === "invitation_sent" && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={resend} disabled={pending} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline disabled:opacity-50">
            <RotateCw size={12} /> {pending ? "Resending…" : "Resend"}
          </button>
          <button type="button" onClick={() => setConfirmRevoke(true)} disabled={pending} className="inline-flex items-center gap-1 text-[12px] font-semibold text-destructive hover:underline disabled:opacity-50">
            <Ban size={12} /> Revoke
          </button>
        </div>
      )}

      {!contactEmail && status === "no_account" && (
        <span className="text-[11px] text-destructive">No contact email on file — add one to invite.</span>
      )}

      {error && <span className="text-[11px] text-destructive">{error}</span>}

      <Modal open={confirmRevoke} onClose={() => (pending ? undefined : setConfirmRevoke(false))}>
        <h3 className="text-lg font-semibold">Revoke this invitation?</h3>
        <p className="mt-2 text-[13.5px] text-muted-fg">
          <strong className="text-foreground">{fullName}</strong>&apos;s current invitation link will stop working immediately. You can send a
          new one at any time.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <Button type="button" onClick={revoke} disabled={pending} className="!bg-destructive !text-white hover:!bg-destructive/90">
            {pending ? "Revoking…" : "Revoke invitation"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setConfirmRevoke(false)} disabled={pending}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)}>
        <h3 className="text-lg font-semibold">Invitation history — {fullName}</h3>
        <div className="mt-3 flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
          {history.map((inv) => (
            <div key={inv.id} className="rounded-xl border border-border p-3 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{inv.email}</span>
                <InvitationStatusBadge status={deriveOnboardingStatus(false, inv)} />
              </div>
              <p className="mt-1 text-[12px] text-muted-fg">
                Sent {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString("en-US", { timeZone: "UTC" }) : "—"}
                {inv.resend_count > 0 ? ` · resent ${inv.resend_count}×` : ""}
                {inv.accepted_at ? ` · accepted ${new Date(inv.accepted_at).toLocaleDateString("en-US", { timeZone: "UTC" })}` : ""}
                {inv.revoked_at ? ` · revoked ${new Date(inv.revoked_at).toLocaleDateString("en-US", { timeZone: "UTC" })}` : ""}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="outline" onClick={() => setHistoryOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
