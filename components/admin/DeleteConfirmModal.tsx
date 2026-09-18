"use client";

import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

// Phase 150 — a reusable, destructive confirmation dialog. No confirmation
// modal existed anywhere in the admin area before this phase (the one
// existing delete — FaqManager.tsx's question-delete — has none at all,
// deletes immediately on click); this is the pattern every new delete
// action added this phase (Inquiries, Session bookings, Find Support
// requests, Find Your Therapist (legacy), Booking requests, Volunteer
// applications, Group registrations) uses, via DeleteRowButton below.
export default function DeleteConfirmModal({
  title,
  description,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-[13.5px] text-muted-fg">{description}</p>
        <p className="mt-2 text-[12.5px] font-medium text-destructive">This action cannot be undone.</p>
        {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending} block className="sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            block
            className="!bg-destructive !text-white hover:!bg-destructive/90 sm:w-auto"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : null}
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
