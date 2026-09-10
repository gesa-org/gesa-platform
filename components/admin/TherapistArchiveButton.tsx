"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Phase 186 — the "Delete" action the spec requires in CRM > Our
// Professionals, on every row and on the edit page's own Danger Zone. Never
// actually deletes a row: it POSTs to /api/admin/therapists/archive, which
// only ever sets profile_status to "archived" (soft delete, per the spec's
// explicit preference) — everything else about the record, including any
// booking/session/application/invitation history, is left exactly as it
// was. Named ARCHIVE in code and API, but the button itself says "Delete"
// (destructive red styling, confirmation copy naming the therapist and
// warning it leaves the CRM/public directory) because that's the action a
// non-technical admin is actually looking for — "archive" is the safe
// mechanism behind it, not the label they need to recognize.
export default function TherapistArchiveButton({
  id,
  fullName,
  hasLinkedAccount,
  onArchived,
}: {
  id: string;
  fullName: string;
  hasLinkedAccount: boolean;
  onArchived: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive(mode: "archive_only" | "archive_and_deactivate_account") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/therapists/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, mode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't archive — try again.");
      setOpen(false);
      onArchived(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't archive — try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Delete ${fullName}`}
        className="inline-flex items-center gap-1.5 rounded-full p-1.5 text-muted-fg transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 size={15} />
      </button>

      <Modal open={open} onClose={() => (pending ? undefined : setOpen(false))}>
        <h3 className="text-lg font-semibold">Delete {fullName}?</h3>
        <p className="mt-2 text-[13.5px] text-muted-fg">
          This removes <span className="font-medium text-foreground">{fullName}</span> from the CRM listing view and
          immediately from the public Our Professionals page. Their record — including bookings, sessions, and their
          original volunteer application if they have one — is archived, not deleted, and can be restored later.
        </p>

        {hasLinkedAccount && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
            <AlertTriangle size={15} className="mt-0.5 flex-none" />
            <span>
              This professional has a linked sign-in account. Choose whether to also deactivate it below — leaving it
              active means they can still sign in even though their profile is archived.
            </span>
          </div>
        )}

        {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}

        <div className="mt-5 flex flex-col gap-2.5">
          {hasLinkedAccount ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => archive("archive_only")}
                disabled={pending}
              >
                Archive profile only
              </Button>
              <Button
                type="button"
                onClick={() => archive("archive_and_deactivate_account")}
                disabled={pending}
                className="!bg-destructive !text-white hover:!bg-destructive/90"
              >
                {pending ? <Loader2 size={15} className="animate-spin" /> : null}
                Deactivate account and archive profile
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => archive("archive_only")}
              disabled={pending}
              className="!bg-destructive !text-white hover:!bg-destructive/90"
            >
              {pending ? <Loader2 size={15} className="animate-spin" /> : null}
              {pending ? "Deleting…" : "Delete Professional"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
