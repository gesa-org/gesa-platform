"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import InvitationStatusBadge, { deriveOnboardingStatus } from "@/components/admin/InvitationStatusBadge";
import type { Tables } from "@/lib/database.types";

export type AdministratorRow = Tables<"profiles">;

// Phase 187 — CRM > Administrators. Two sections rendered by the page: this
// table (existing accounts, with Deactivate/Reactivate) and a separate
// pending-invitations list built the same way TherapistInviteActions does
// for professionals — kept as one component here since an "administrator"
// row and its own latest invitation are the same underlying data shape.
export default function AdministratorsTable({
  administrators,
  invitations,
  currentUserId,
}: {
  administrators: AdministratorRow[];
  invitations: Tables<"invitations">[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdministratorRow | null>(null);

  const pendingInvitations = invitations.filter((inv) => inv.status === "sent" || inv.status === "opened");

  async function toggleActive(admin: AdministratorRow, mode: "deactivate" | "reactivate") {
    setPendingId(admin.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/administrators/${admin.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not update that account.");
      setConfirmTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update that account.");
    } finally {
      setPendingId(null);
    }
  }

  async function resendInvitation(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/invitations/${id}/resend`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not resend the invitation.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend the invitation.");
    } finally {
      setPendingId(null);
    }
  }

  async function revokeInvitation(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/invitations/${id}/revoke`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not revoke the invitation.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke the invitation.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-[15px] font-semibold">Administrators ({administrators.length})</h3>
        </div>
        <table className="w-full text-left text-[14px]">
          <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {administrators.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-5 py-3 font-medium">
                  {a.full_name || "—"} {a.id === currentUserId && <span className="text-[12px] text-muted-fg">(you)</span>}
                </td>
                <td className="px-5 py-3 text-muted-fg">{a.email || "—"}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-primary">
                    {a.role === "super_admin" ? "Super Admin" : "Administrator"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {a.id === currentUserId ? (
                    <span className="text-[12px] text-muted-fg">Manage from your own account settings</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(a)}
                      disabled={pendingId === a.id}
                      className="text-[12.5px] font-semibold text-destructive hover:underline disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-[15px] font-semibold">Pending invitations ({pendingInvitations.length})</h3>
        </div>
        {pendingInvitations.length === 0 ? (
          <p className="p-5 text-[13.5px] text-muted-fg">No pending administrator invitations.</p>
        ) : (
          <table className="w-full text-left text-[14px]">
            <thead className="bg-secondary/60 text-[12.5px] uppercase tracking-wide text-muted-fg">
              <tr>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Sent</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pendingInvitations.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{inv.email}</td>
                  <td className="px-5 py-3 text-muted-fg">{inv.invited_role === "super_admin" ? "Super Admin" : "Administrator"}</td>
                  <td className="px-5 py-3">
                    <InvitationStatusBadge status={deriveOnboardingStatus(false, inv)} />
                  </td>
                  <td className="px-5 py-3 text-muted-fg">{inv.sent_at ? new Date(inv.sent_at).toLocaleDateString("en-US", { timeZone: "UTC" }) : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => resendInvitation(inv.id)} disabled={pendingId === inv.id} className="text-[12.5px] font-semibold text-primary hover:underline disabled:opacity-50">
                        Resend
                      </button>
                      <button type="button" onClick={() => revokeInvitation(inv.id)} disabled={pendingId === inv.id} className="text-[12.5px] font-semibold text-destructive hover:underline disabled:opacity-50">
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={confirmTarget !== null} onClose={() => setConfirmTarget(null)}>
        {confirmTarget && (
          <>
            <h3 className="text-lg font-semibold">Deactivate {confirmTarget.full_name || confirmTarget.email}?</h3>
            <p className="mt-2 text-[13.5px] text-muted-fg">
              They&apos;ll immediately lose the ability to sign in. Their role and every audit-log entry involving
              them stay exactly as they are — this can be reversed at any time.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button type="button" onClick={() => toggleActive(confirmTarget, "deactivate")} disabled={pendingId === confirmTarget.id} className="!bg-destructive !text-white hover:!bg-destructive/90">
                {pendingId === confirmTarget.id ? "Deactivating…" : "Deactivate account"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
