"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { TherapistApplicationStatus } from "@/lib/database.types";

const STATUSES: TherapistApplicationStatus[] = ["new", "reviewing", "approved", "rejected", "withdrawn"];

// Phase 186 — colored per status so "at a glance" scanning of the list
// actually works (the old plain <select> looked identical regardless of
// value). Kept deliberately distinct from every profile_status color below
// (TherapistProfileStatusBadge) — an application's review status and a
// profile's publication status are shown right next to each other once a
// profile exists, and must never look like the same kind of badge.
const STATUS_STYLES: Record<TherapistApplicationStatus, string> = {
  new: "bg-secondary text-muted-fg",
  reviewing: "bg-clay-soft text-clay",
  approved: "bg-accent-soft text-primary",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-secondary text-muted-fg line-through decoration-1",
};

const STATUS_LABELS: Record<TherapistApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function VolunteerApplicationStatusControl({
  id,
  fullName,
  email,
  status,
  linkedProfile,
  onStatusChange,
  onProfileCreated,
}: {
  id: string;
  fullName: string;
  email: string;
  status: TherapistApplicationStatus;
  // Phase 186 — set once this application has a linked therapists row
  // (from VolunteerApplicationsTable's own lookup) — null until then.
  linkedProfile: { id: string; profile_status: string } | null;
  onStatusChange: (next: TherapistApplicationStatus) => void;
  onProfileCreated: (therapistId: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [invitePending, setInvitePending] = useState(false);

  function commitStatus(next: TherapistApplicationStatus) {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("therapist_applications")
        .update({ status: next, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) {
        setError("Couldn't save — try again.");
        return;
      }
      onStatusChange(next);
    });
  }

  function onSelectChange(next: TherapistApplicationStatus) {
    // Phase 186 — "Approved" is the one transition that needs a deliberate,
    // explicit choice between two different outcomes (spec: show a
    // confirmation modal with "Approve application only" / "Approve and
    // create professional profile"), so it's intercepted here instead of
    // committing straight through like every other status does. Re-picking
    // "approved" when it's already approved is a no-op — reopening the
    // modal would be confusing, not useful.
    if (next === "approved" && status !== "approved") {
      setConfirmOpen(true);
      return;
    }
    commitStatus(next);
  }

  async function approveOnly() {
    setConfirmOpen(false);
    commitStatus("approved");
  }

  // Phase 187 — shared by both "Approve and create professional profile"
  // and "...and send invitation": the create-profile call is identical
  // either way, only what happens after differs. `sendInvite` controls
  // whether this also calls the invitations API with the application's own
  // email before navigating to the new draft's editor — per the spec,
  // "Send the invitation only after the profile and email are validated,"
  // which is exactly what create-profile's own validation (approved status,
  // no existing link) plus the invitations route's email-format check
  // together guarantee.
  async function approveAndCreateProfile(sendInvite: boolean) {
    setCreatingProfile(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/volunteer-applications/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not create the professional profile.");
      onStatusChange("approved");
      onProfileCreated(data.therapistId as string);
      setConfirmOpen(false);

      if (sendInvite) {
        setInvitePending(true);
        const inviteRes = await fetch("/api/admin/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            invitedRole: "therapist",
            therapistProfileId: data.therapistId,
            volunteerApplicationId: id,
            firstName: fullName.split(/\s+/)[0] ?? null,
          }),
        });
        const inviteData = await inviteRes.json().catch(() => null);
        setInvitePending(false);
        if (!inviteRes.ok) {
          // The profile was still created — don't lose that on an
          // invitation-send failure. Surface it and let the admin retry
          // from Our Professionals' own "Send invitation" action instead.
          setError(`Profile created, but the invitation couldn't be sent: ${inviteData?.error ?? "unknown error"}. You can send it from Our Professionals.`);
        }
      }

      // Straight to the full editor — spec: "Require the administrator to
      // review and edit all public-facing details before saving," and this
      // is the same "create minimal record, then edit everything else on
      // its own page" pattern AddTherapistModal already uses.
      router.push(`/admin/therapists/${data.therapistId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the professional profile.");
    } finally {
      setCreatingProfile(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => onSelectChange(e.target.value as TherapistApplicationStatus)}
          aria-label={`Change status for ${fullName}`}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground focus:outline-none disabled:opacity-60"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="mt-1 text-[11.5px] text-destructive">{error}</div>}

      {/* Phase 186 — the four states the spec's "clear messages" requirement
          asks for, in order: not yet approved / approved-not-added /
          added-as-draft / published. */}
      <p className="mt-1.5 text-[11.5px] text-muted-fg">
        {status !== "approved"
          ? "Not yet approved."
          : linkedProfile
            ? linkedProfile.profile_status === "active"
              ? "Published as an active professional."
              : "Added as a draft professional — not public yet."
            : "Approved, not yet added as a professional."}
      </p>

      {status === "approved" && linkedProfile && (
        <a href={`/admin/therapists/${linkedProfile.id}`} className="mt-1 inline-block text-[11.5px] font-semibold text-primary underline">
          View professional profile →
        </a>
      )}
      {status === "approved" && !linkedProfile && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-1.5"
          onClick={() => approveAndCreateProfile(false)}
          disabled={creatingProfile}
        >
          {creatingProfile ? <Loader2 size={13} className="animate-spin" /> : null}
          {creatingProfile ? "Creating…" : "Create Professional Profile"}
        </Button>
      )}

      <Modal open={confirmOpen} onClose={() => (creatingProfile ? undefined : setConfirmOpen(false))}>
        <h3 className="text-lg font-semibold">Approve {fullName}&apos;s application?</h3>
        <p className="mt-2 text-[13.5px] text-muted-fg">
          Approving is a review decision. It does not, by itself, create or publish a professional profile — choose
          how you&apos;d like to proceed.
        </p>
        {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
        <div className="mt-5 flex flex-col gap-2.5">
          <Button type="button" variant="outline" onClick={approveOnly} disabled={creatingProfile}>
            Approve application only
          </Button>
          <Button type="button" variant="outline" onClick={() => approveAndCreateProfile(false)} disabled={creatingProfile}>
            {creatingProfile ? <Loader2 size={15} className="animate-spin" /> : null}
            {creatingProfile ? "Creating…" : "Approve and create professional profile"}
          </Button>
          <Button type="button" onClick={() => approveAndCreateProfile(true)} disabled={creatingProfile || invitePending}>
            {creatingProfile || invitePending ? <Loader2 size={15} className="animate-spin" /> : null}
            {creatingProfile ? "Creating…" : invitePending ? "Sending invitation…" : "Approve, create profile, and send invitation"}
          </Button>
          <p className="text-[11.5px] text-muted-fg">
            &quot;Approve application only&quot; leaves this applicant out of Our Professionals and the public
            directory — you can still create their profile (and invite them) later from here. The profile always
            starts as a draft either way; sending an invitation lets them sign in, it never publishes them publicly.
          </p>
        </div>
      </Modal>
    </div>
  );
}
