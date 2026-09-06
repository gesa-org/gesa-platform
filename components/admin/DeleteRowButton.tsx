"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

// Phase 150 — the one reusable delete control every admin list/detail view
// added this phase uses (Inquiries, Session bookings, Find Support
// requests, Find Your Therapist (legacy), Booking requests, Volunteer
// applications, Group registrations). Deliberately keyed on the record's
// real database `id` (never a list index), and the actual delete only ever
// happens server-side against that id (see each `endpoint` route, all of
// which re-check admin auth via getCurrentProfile() before using the
// service-role client) — this component only ever *asks* for that, it
// can't perform a delete on its own.
//
// No toast/notification library exists anywhere in this codebase (checked
// during this phase's audit), so the "success toast" required by the spec
// is a small self-contained fixed-position banner rendered from this
// component itself rather than a new global provider — simplest thing that
// satisfies the requirement without inventing app-wide toast infrastructure
// nobody else uses yet.
export default function DeleteRowButton({
  endpoint,
  id,
  confirmTitle,
  confirmDescription,
  onDeleted,
  label = "Delete",
}: {
  endpoint: string;
  id: string;
  confirmTitle: string;
  confirmDescription: string;
  onDeleted: (id: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Delete failed");
      }
      setOpen(false);
      setToast("success");
      onDeleted(id);
    } catch {
      setError("Couldn't delete — please try again.");
      setToast("error");
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
        aria-label={label}
        className="inline-flex items-center gap-1.5 rounded-full p-1.5 text-muted-fg transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 size={15} />
      </button>

      {open && (
        <DeleteConfirmModal
          title={confirmTitle}
          description={confirmDescription}
          pending={pending}
          error={error}
          onConfirm={confirmDelete}
          onCancel={() => !pending && setOpen(false)}
        />
      )}

      {toast === "success" && (
        <div className="fixed bottom-5 right-5 z-[300] rounded-xl bg-primary px-4 py-3 text-[13.5px] font-medium text-white shadow-2xl">
          Deleted successfully.
        </div>
      )}
      {toast === "error" && (
        <div className="fixed bottom-5 right-5 z-[300] rounded-xl bg-destructive px-4 py-3 text-[13.5px] font-medium text-white shadow-2xl">
          Couldn&apos;t delete — please try again.
        </div>
      )}
    </>
  );
}
