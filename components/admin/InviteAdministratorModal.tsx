"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Phase 187 — "Invite Administrator." Two steps: a plain form, then a
// required confirmation modal (per the spec — "this grants sensitive CRM
// access") naming exactly who's about to get exactly which role, before the
// invitation actually goes out. Super Admin is only offered as a role
// choice when the signed-in caller is themselves a Super Admin — enforced
// again, for real, server-side in app/api/admin/invitations/route.ts (this
// is just the corresponding UI-level narrowing, not the authority).
export default function InviteAdministratorModal({ canInviteSuperAdmin }: { canInviteSuperAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function close() {
    setOpen(false);
    setConfirming(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("admin");
    setError(null);
    setDone(false);
    router.refresh();
  }

  async function send() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, invitedRole: role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not send the invitation.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the invitation.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5">
        <UserPlus size={15} /> Invite Administrator
      </Button>

      <Modal open={open} onClose={close}>
        {done ? (
          <div>
            <h3 className="text-lg font-semibold">Invitation sent</h3>
            <p className="mt-2 text-[13.5px] text-muted-fg">
              {email} can now accept their invitation and set up their account. They&apos;ll have no CRM access
              until they do.
            </p>
            <div className="mt-5 flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : confirming ? (
          <div>
            <h3 className="text-lg font-semibold">Confirm this invitation</h3>
            <p className="mt-2 text-[13.5px] text-muted-fg">
              This grants sensitive CRM access. Double-check before sending.
            </p>
            <dl className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-3.5 text-[13.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-fg">Name</dt>
                <dd className="font-medium">{firstName} {lastName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-fg">Email</dt>
                <dd className="font-medium">{email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-fg">Role</dt>
                <dd className="font-medium">{role === "super_admin" ? "Super Admin" : "Administrator"}</dd>
              </div>
            </dl>
            {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
            <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4">
              <Button type="button" onClick={send} disabled={pending} className="!bg-destructive !text-white hover:!bg-destructive/90">
                {pending ? "Sending…" : "Yes, send this invitation"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirming(true);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <h3 className="text-lg font-semibold">Invite Administrator</h3>
              <p className="mt-1 text-[13px] text-muted-fg">
                They won&apos;t have any CRM access until they accept this invitation and set a password.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="invite-admin-first" className="mb-1.5 block text-sm font-semibold">First name</label>
                <input id="invite-admin-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label htmlFor="invite-admin-last" className="mb-1.5 block text-sm font-semibold">Last name</label>
                <input id="invite-admin-last" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div>
              <label htmlFor="invite-admin-email" className="mb-1.5 block text-sm font-semibold">Email</label>
              <input id="invite-admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label htmlFor="invite-admin-role" className="mb-1.5 block text-sm font-semibold">Role</label>
              <select
                id="invite-admin-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 focus:border-primary focus:outline-none"
              >
                <option value="admin">Administrator</option>
                {canInviteSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
            </div>
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button type="submit" disabled={!firstName.trim() || !lastName.trim() || !email.trim()}>
                Continue
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
